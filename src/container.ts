import {
  Container as ContainerInterface,
  ContainerCreateOptions,
  ContainerInfo,
  ContainerInspectInfo,
} from 'dockerode';
import { RunningContainerInfo, ContainerClientInterface } from './interfaces';
import chalk from 'chalk';

export class Container implements ContainerClientInterface {
  client: any;

  constructor(client: any) {
    this.client = client;
  }

  async create(
    createOpts: ContainerCreateOptions
  ): Promise<ContainerInterface | undefined> {
    let container: ContainerInterface;
    try {
      container = await this.client.createContainer(createOpts);
      return container;
    } catch (err) {
      console.log(chalk.red(`create container error: ${err}`));
      return;
    }
  }

  static async start(container: ContainerInterface): Promise<void> {
    try {
      await container.start();
      console.log(chalk.cyan(`Started container ${container['id']}`));
    } catch (err) {
      console.log(chalk.red(`start container error: ${err}`));
    }
  }

  static async stop(container: ContainerInterface): Promise<void> {
    try {
      await container.stop();
      console.log(chalk.cyan(`Stopped container ${container['id']}`));
    } catch (err) {
      console.log(chalk.red(`stop container error: ${err}`));
    }
  }

  static async remove(container: ContainerInterface): Promise<void> {
    try {
      await container.remove();
      console.log(chalk.cyan(`Removed container ${container['id']}`));
    } catch (err) {
      console.log(chalk.red(`remove container error: ${err}`));
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
          interfaceObject: container,
        };
        runningContainers.push(containerObject);
      }

      return runningContainers;
    } catch (err) {
      console.log(chalk.red(`running containers error: ${err}`));
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
