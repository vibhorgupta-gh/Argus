import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { hostname } from 'os';
import { ImageInspectInfo, ContainerInspectInfo } from 'dockerode';
import { Counter, Gauge, collectDefaultMetrics, Registry } from 'prom-client';
import {
  InfluxDB,
  WriteApi,
  Point,
  ClientOptions,
} from '@influxdata/influxdb-client';
import {
  DataServiceInterface,
  PrometheusInterface,
  InfluxInterface,
  ConfigInterface,
} from './interfaces';
import { logger } from './logger';

export class DataService implements DataServiceInterface {
  private prometheus;
  private influx;
  public monitoredContainers: Map<string, number>;
  public updatedContainers: Map<string, number>;
  public updatedContainerObjects: [
    ImageInspectInfo,
    ImageInspectInfo,
    ContainerInspectInfo
  ][];

  constructor(clientConfig: ConfigInterface) {
    this.monitoredContainers = new Map<string, number>();
    this.updatedContainers = new Map<string, number>();
    this.updatedContainerObjects = new Array<
      [ImageInspectInfo, ImageInspectInfo, ContainerInspectInfo]
    >();
    this.prometheus =
      clientConfig.prometheusConfig?.host && clientConfig.prometheusConfig?.port
        ? new Prometheus(
            clientConfig.prometheusConfig.host,
            clientConfig.prometheusConfig.port
          )
        : null;
    this.influx =
      clientConfig.influxConfig?.url && clientConfig.influxConfig?.token
        ? new InfluxClient(
            clientConfig.influxConfig.url,
            clientConfig.influxConfig.token,
            clientConfig.influxConfig.org,
            clientConfig.influxConfig.bucket
          )
        : null;
  }

  setGauges(socket: string | undefined): void {
    if (!this.prometheus) return;
    this.prometheus.setMonitoredContainersGauge(
      socket,
      this.monitoredContainers
    );
  }

  addMetric(containerLabel: string, socket: string | undefined): void {
    if (this.prometheus) {
      this.prometheus.updateContainersCounter(
        containerLabel,
        socket,
        this.updatedContainers
      );
    }
    if (this.influx) {
      this.influx.writePoints(
        containerLabel,
        socket,
        this.monitoredContainers,
        this.updatedContainers
      );
    }
  }
}

class Prometheus implements PrometheusInterface {
  private prometheusHost: string;
  private prometheusPort: number;
  private registry: Registry;
  private updatedContainersCounter: any;
  private monitoredContainersGauge: any;
  private allContainersGauge: any;

  constructor(prometheusHost: string, prometheusPort: number) {
    this.prometheusHost = prometheusHost;
    this.prometheusPort = prometheusPort;

    this.registry = new Registry();
    this.registry.setDefaultLabels({ app: 'argus' });
    collectDefaultMetrics({ register: this.registry, prefix: 'argus_' });

    this.updatedContainersCounter = new Counter({
      name: 'updated_containers',
      help: 'Count of updated containers',
      labelNames: ['socket', 'container'],
    });
    this.monitoredContainersGauge = new Gauge({
      name: 'monitored_containers',
      help: 'Gauge of containers being monitored',
      labelNames: ['socket'],
    });
    this.allContainersGauge = new Gauge({
      name: 'all_updated_containers',
      help: 'Gauge of total updated',
      labelNames: ['socket'],
    });

    this.registry.registerMetric(this.monitoredContainersGauge);
    this.registry.registerMetric(this.allContainersGauge);
    this.registry.registerMetric(this.updatedContainersCounter);

    this.startPrometheusServer();
  }

  setMonitoredContainersGauge(
    socket: string | undefined,
    monitoredContainers: Map<string, number>
  ): void {
    this.monitoredContainersGauge
      .labels(socket)
      .set(monitoredContainers.get(socket));
    logger.debug(
      `Prometheus: monitored containers gauge set to: ${socket} -> ${monitoredContainers.get(
        socket
      )}`
    );
  }

  updateContainersCounter(
    containerLabel: string,
    socket: string | undefined,
    updatedContainers: Map<string, number>
  ): void {
    if (containerLabel === 'all')
      this.allContainersGauge.labels(socket).set(updatedContainers.get(socket));
    else this.updatedContainersCounter.labels(socket, containerLabel).inc();
    logger.debug(
      `Prometheus: updated containers counter incremented for ${socket} -> ${containerLabel}`
    );
  }

  startPrometheusServer(): void {
    const server: Server = createServer(
      async (request: IncomingMessage, response: ServerResponse) => {
        const route: string = request.url;
        try {
          if (route === '/metrics') {
            response.setHeader('Content-Type', this.registry.contentType);
            response.end(await this.registry.metrics());
          }
        } catch (e) {
          response.end(e);
        }
      }
    );

    server.listen(this.prometheusPort, this.prometheusHost.split('://')[1]);
  }
}

class InfluxClient implements InfluxInterface {
  private influxUrl: string;
  private influxToken: string;
  private influxOrg: string;
  private influxBucket: string;

  private influxClient: InfluxDB;
  private influxWriteApi: WriteApi;

  constructor(url: string, token: string, orgName: string, bucketName: string) {
    this.influxUrl = url;
    this.influxToken = token;
    this.influxOrg = orgName;
    this.influxBucket = bucketName;

    this.initializeInflux();
    this.setupInfluxWriteApi();
  }

  private initializeInflux(): void {
    const influxOpts: ClientOptions = {
      url: this.influxUrl,
      token: this.influxToken,
    };
    this.influxClient = new InfluxDB(influxOpts);
  }

  private setupInfluxWriteApi(): void {
    this.influxWriteApi = this.influxClient.getWriteApi(
      this.influxOrg,
      this.influxBucket
    );
    this.influxWriteApi.useDefaultTags({
      location: hostname(),
      service: 'argus',
    });
  }

  writePoints(
    containerLabel: string,
    socket: string | undefined,
    monitoredContainers: Map<string, number>,
    updatedContainers: Map<string, number>
  ): void {
    const containerPoint = new Point('Argus').timestamp(new Date());

    if (containerLabel === 'all') {
      containerPoint
        .tag('type', 'stats')
        .intField('monitored_containers', monitoredContainers.get(socket))
        .intField('updated_containers', updatedContainers.get(socket));
    } else {
      containerPoint
        .tag('type', 'container_update')
        .tag('container', containerLabel)
        .intField('count', 1);
    }

    this.influxWriteApi.writePoint(containerPoint);
    logger.info(
      `InfluxDB: Container update stats written to database -> ${JSON.stringify(
        containerPoint
      )}`
    );
  }
}
