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

  /**
   * Creates a new container for provided create config
   *
   * @param {ContainerCreateOptions} createOpts - Options config to create container
   * @return {(Promise<ContainerInterface | undefined>)}
   * @memberof Container
   */
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

  /**
   * Starts up the specified dormant container object
   *
   * @static
   * @param {ContainerInterface} container - Container object to start
   * @return {Promise<void>}
   * @memberof Container
   */
  static async start(container: ContainerInterface): Promise<void> {
    try {
      await container.start();
      console.log(chalk.cyan(`Started container ${container.id}`));
    } catch (err) {
      console.log(chalk.red(`start container error: ${err}`));
    }
  }

  /**
   * Stops the specified running container object
   *
   * @static
   * @param {ContainerInterface} container - Container object to stop
   * @return {Promise<void>}
   * @memberof Container
   */
  static async stop(container: ContainerInterface): Promise<void> {
    try {
      await container.stop();
      console.log(chalk.cyan(`Stopped container ${container.id}`));
    } catch (err) {
      console.log(chalk.red(`stop container error: ${err}`));
    }
  }

  /**
   * Deletes the specified stopped container object
   *
   * @static
   * @param {ContainerInterface} container - Container object to remove
   * @return {Promise<void>}
   * @memberof Container
   */
  static async remove(container: ContainerInterface): Promise<void> {
    try {
      await container.remove();
      console.log(chalk.cyan(`Removed container ${container.id}`));
    } catch (err) {
      console.log(chalk.red(`remove container error: ${err}`));
    }
  }

  /**
   * Gets list of all containers in running state for this Docker client.
   * This is a list of custom objects comprising container objects of both Container and ContainerInfo interfaces.
   * This is done to make available both types readily, since the API often switches between them as argument types.
   *
   * @return {(Promise<RunningContainerInfo[] | undefined>)}
   * @memberof Container
   */
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
        if (c.Image.includes('argus')) continue;
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

  /**
   * Filters already running containers for user specified ones, to allow selective monitoring.
   *
   * @static
   * @param {(RunningContainerInfo[] | undefined)} containers - All running containers
   * @param {(string[] | undefined)} containerNamesToMonitor - List of user specified container names to be monitored
   * @param {(string[] | undefined)} containerNamesToIgnore - List of user specified container names to be monitored
   * @return {(RunningContainerInfo[] | undefined)}
   * @memberof Container
   */
  static getRunningContainersToMonitor(
    containers: RunningContainerInfo[] | undefined,
    containerNamesToMonitor: string[] | undefined,
    containerNamesToIgnore: string[] | undefined
  ): RunningContainerInfo[] | undefined {
    if (!containerNamesToMonitor.length && !containerNamesToIgnore.length) {
      return containers;
    } else if (
      containerNamesToMonitor.length &&
      containerNamesToIgnore.length
    ) {
      const intersection:
        | string[]
        | undefined = containerNamesToMonitor.filter((containerName) =>
        containerNamesToIgnore.includes(containerName)
      );
      if (intersection.length) throw new Error();
    }

    let containersToMonitor: RunningContainerInfo[] | undefined = [];
    if (containerNamesToMonitor.length) {
      containersToMonitor = containers.filter((container) =>
        containerNamesToMonitor.includes(
          container.inspectObject?.Name.substring(1)
        )
      );
    }
    if (containerNamesToIgnore.length) {
      containersToMonitor = (containersToMonitor || containers).filter(
        (container) =>
          !containerNamesToIgnore.includes(
            container.inspectObject?.Name.substring(1)
          )
      );
    }
    return containersToMonitor;
  }

  /**
   * Returns new config for starting a fresh container. Config contains old container params
   * and latest image pull
   *
   * @static
   * @param {ContainerInspectInfo} oldContainer - Old container object, to extract old run config
   * @param {string} newImage - Latest pull image (to be used as base image for new container)
   * @return {ContainerCreateOptions}
   * @memberof Container
   */
  static newContainerConfig(
    oldContainer: ContainerInspectInfo,
    newImage: string
  ): ContainerCreateOptions {
    const config: ContainerCreateOptions = {
      name: oldContainer.Name.replace('/', ''),
      Image: newImage,
      Cmd: oldContainer.Config.Cmd,
      HostConfig: oldContainer.HostConfig,
      Labels: oldContainer.Config.Labels,
      Entrypoint: oldContainer.Config.Entrypoint,
      Env: oldContainer.Config.Env,
    };
    return config;
  }
}
