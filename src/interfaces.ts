import {
  DockerOptions,
  Container as ContainerInterface,
  ContainerInspectInfo,
  ContainerCreateOptions,
  ImageInspectInfo,
  ImageInfo,
} from 'dockerode';
import { SendMailOptions, SentMessageInfo } from 'nodemailer';
import { SmtpOptions } from 'nodemailer-smtp-transport';

export type DockerInitOptions = DockerOptions;

export interface CliArgumentsInterface {
  [x: string]: unknown;
  runonce: boolean;
  cleanup: boolean;
  host: string | undefined;
  interval: number | undefined;
  monitor: string | null;
  ignore: string | null;
  user: string | null;
  pass: string | null;
  $0: string;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
  smtpSender?: string | null;
  smtpRecipients?: string | null;
  webhookUrls?: string | null;
  pushoverToken?: string | null;
  pushoverUser?: string | null;
  pushoverDevice?: string | null;
  telegramToken?: string | null;
  telegramChat?: string | null;
  prometheusHost?: string | null;
  prometheusPort?: number | null;
  influxUrl?: string | null;
  influxToken?: string | null;
  influxOrg?: string | null;
  influxBucket?: string | null;
  privateRegistry?: string | undefined;
  semverUpdate?: boolean;
  allowMajorUpdate?: boolean;
  patchOnly?: boolean;
}

export interface ConfigInterface {
  runOnce: boolean;
  cleanImage: boolean;
  dockerHost: string | undefined;
  watchInterval: number | undefined;
  containersToMonitor: string[] | null;
  containersToIgnore: string[] | null;
  repoUser: string | null;
  repoPass: string | null;
  emailConfig?: SmtpOptions;
  emailOptions?: SendMailOptions;
  webhookUrls?: string[] | undefined;
  pushoverAppToken?: string | undefined;
  pushoverUserKey?: string | undefined;
  pushoverDevice?: string | undefined;
  telegramBotToken?: string | undefined;
  telegramChatId?: string | undefined;
  prometheusConfig?: PromOptions;
  influxConfig?: InfluxOptions;
  privateRegistry?: string | undefined;
  semverUpdate?: boolean;
  allowMajorUpdate?: boolean;
  patchOnly?: boolean;
  extractDockerConfig(): DockerInitOptions;
}

export interface ContainerClientInterface {
  client: any;
  create(
    createOpts: ContainerCreateOptions
  ): Promise<ContainerInterface | undefined>;
  getRunningContainers(): Promise<RunningContainerInfo[] | undefined>;
}

export interface ImageClientInterface {
  client: any;
  listAll(): Promise<ImageInfo[] | undefined>;
  inspect(name: string): Promise<ImageInspectInfo | undefined>;
  pullLatestImage(
    imageName: string,
    imageTag: string,
    config: ConfigInterface
  ): Promise<ImageInspectInfo | undefined>;
  remove(image: ImageInspectInfo): Promise<void>;
  getUntaggedImageName(name: string): string | undefined;
  getImageTag(name: string): string | undefined;
}

export interface ArgusClientInterface {
  DockerClient: any;
  ContainerClient: ContainerClientInterface;
  ImageClient: ImageClientInterface;
  NotificationClient: NotificationInterface;
  DataClient: DataServiceInterface;
  execute(): Promise<void>;
}

export interface RunningContainerInfo {
  inspectObject?: ContainerInspectInfo;
  interfaceObject?: ContainerInterface;
}

export interface PullAuthInterface {
  username: string;
  password: string;
  auth?: string;
  email?: string;
  serveraddress?: string;
}

export interface NotificationInterface {
  emailOpts: SendMailOptions;
  emailNotifier: EmailServiceInterface | undefined;
  webhookNotifier: WebhookInterface | undefined;
  dataClient: DataServiceInterface | undefined;
  sendNotifications(
    monitoredContainers: number | undefined,
    updatedContainers: number | undefined,
    updatedContainerObjects: [
      ImageInspectInfo,
      ImageInspectInfo,
      ContainerInspectInfo
    ][]
  ): Promise<[any, void]>;
}

export interface EmailServiceInterface {
  emailOptions: SendMailOptions;
  sendEmail(
    dockerHost: string | null,
    monitoredContainers: number | undefined,
    updatedContainers: number | undefined,
    updatedContainerObjects: [
      ImageInspectInfo,
      ImageInspectInfo,
      ContainerInspectInfo
    ][]
  ): Promise<SentMessageInfo | undefined>;
}

export interface WebhookInterface {
  webhookUrls: string[] | undefined;
  pushoverAppToken: string | undefined;
  pushoverUserKey: string | undefined;
  pushoverDevice: string | undefined;
  telegramBotToken: string | undefined;
  telegramChatId: string | undefined;
  sendWebhookNotifications(
    dockerHost: string | null,
    monitoredContainers: number | undefined,
    updatedContainers: number | undefined,
    updatedContainerObjects: [
      ImageInspectInfo,
      ImageInspectInfo,
      ContainerInspectInfo
    ][]
  ): Promise<void | undefined>;
  modelWebhookPayload(
    webhookType: string | null,
    dockerHost: string | null,
    monitoredContainers: number | undefined,
    updatedContainers: number | undefined,
    updatedContainerObjects: [
      ImageInspectInfo,
      ImageInspectInfo,
      ContainerInspectInfo
    ][]
  ): string;
  postToWebhooks(
    dispatchUrlPayloadPairs: [string, string][] | undefined
  ): Promise<void | undefined>;
}

export interface DataServiceInterface {
  monitoredContainers: Map<string, number>;
  updatedContainers: Map<string, number>;
  updatedContainerObjects: [
    ImageInspectInfo,
    ImageInspectInfo,
    ContainerInspectInfo
  ][];
  setGauges(socket: string | undefined): void;
  addMetric(containerLabel: string, socket: string | undefined): void;
}

export interface PromOptions {
  host: string | null;
  port: number | null;
}

export interface InfluxOptions {
  url: string | null;
  token: string | null;
  org: string | null;
  bucket: string | null;
}

export interface PrometheusInterface {
  setMonitoredContainersGauge(
    socket: string | undefined,
    monitoredContainers: Map<string, number>
  ): void;
  updateContainersCounter(
    containerLabel: string,
    socket: string | undefined,
    updatedContainers: Map<string, number>
  ): void;
  startPrometheusServer(): void;
}

export interface InfluxInterface {
  writePoints(
    containerLabel: string,
    socket: string | undefined,
    monitoredContainers: Map<string, number>,
    updatedContainers: Map<string, number>
  ): void;
}

export interface RegistryInterface {
  getRepositoryTags(repoName: string): Promise<string[] | undefined>;
}
export interface RegistryOpts {
  registryBase: string | null;
  repoUser?: string | null;
  repoPass?: string | null;
}
