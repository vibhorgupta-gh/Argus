import {
  Container as ContainerInterface,
  ContainerCreateOptions,
  ContainerInfo,
  ContainerInspectInfo,
  HostConfig,
} from 'dockerode';


export interface RunningContainerInfo {
  inspectObject?: ContainerInspectInfo;
  interfaceObject?: ContainerInterface;
}

export class Container {
  client: any;

  constructor(client: any) {
    this.client = client;
  }

  async create(
    opts: ContainerCreateOptions
  ): Promise<ContainerInterface | undefined> {
    let container: ContainerInterface;
    const { name, Image, Cmd, HostConfig, Labels, Entrypoint, Env } = opts;
    try {
      const createOpts: ContainerCreateOptions = {
        name,
        Image,
        Cmd,
        HostConfig,
        Labels,
        Entrypoint,
        Env,
      };
      container = await this.client.createContainer(createOpts);
      return container;
    } catch (err) {
      console.log(`create container error: ${err}`);
      return;
    }
  }

  static async start(container: any): Promise<void> {
    try {
      await container.start();
      console.log(`Started container ${container['id']}`);
    } catch (err) {
      console.log(`start container error: ${err}`);
    }
  }

  static async stop(container: ContainerInterface): Promise<void> {
    try {
      await container.stop();
      console.log(`Stopped container ${container['id']}`);
    } catch (err) {
      console.log(`stop container error: ${err}`);
    }
  }

  static async remove(container: ContainerInterface): Promise<void> {
    try {
      await container.remove();
      console.log(`Removed container ${container['id']}`);
    } catch (err) {
      console.log(`remove container error: ${err}`);
    }
  }

  async getRunningContainers(): Promise<RunningContainerInfo[] | undefined> {
    const runningContainers: RunningContainerInfo[] = [];
    const opts: any = {
      filters: {
        status: ['running'],
      },
    };
    try {
      const containers: ContainerInfo[] = await this.client.listContainers(
        opts
      );

      for (const c of containers) {
        const container: ContainerInterface = await this.client.getContainer(
          c.Id
        );
        const containerInspect: ContainerInspectInfo = await container.inspect();
        const containerObject: RunningContainerInfo = {
          inspectObject: containerInspect,
          interfaceObject: container
        }
        runningContainers.push(containerObject);
      }

      return runningContainers;
    } catch (err) {
      console.log(`running containers error: ${err}`);
      return;
    }
  }

  static newContainerConfig(
    oldContainer: ContainerInspectInfo,
    newImage: string
  ): ContainerCreateOptions {
    const config: ContainerCreateOptions = {
      name: oldContainer['Name'].replace('/', ''),
      Image: newImage,
      Cmd: oldContainer['Config']['Cmd'],
      HostConfig: oldContainer['HostConfig'],
      Labels: oldContainer['Config']['Labels'],
      Entrypoint: oldContainer['Config']['Entrypoint'],
      Env: oldContainer['Config']['Env'],
    };
    return config;
  }
}
