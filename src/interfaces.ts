import {
  DockerOptions,
  Container as ContainerInterface,
  ContainerInspectInfo,
  ContainerCreateOptions,
  ImageInspectInfo,
  ImageInfo,
} from 'dockerode';

export type DockerInitOptions = DockerOptions;

export interface CliArgumentsInterface {
  [x: string]: unknown;
  runonce: boolean;
  cleanup: boolean;
  host: string | undefined;
  interval: number | undefined;
  monitor: string | undefined;
  $0: string;
}

export interface ConfigInterface {
  runOnce: boolean;
  cleanImage: boolean;
  dockerHost: string | undefined;
  watchInterval: number | undefined;
  containersToMonitor: string[] | undefined;
  extractDockerConfig(): DockerInitOptions;
}

export interface RunningContainerInfo {
  inspectObject?: ContainerInspectInfo;
  interfaceObject?: ContainerInterface;
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
    image: ImageInspectInfo
  ): Promise<ImageInspectInfo | undefined>;
  remove(image: ImageInspectInfo): Promise<void>;
}

export interface ArgusClientInterface {
  DockerClient: any;
  ContainerClient: ContainerClientInterface;
  ImageClient: ImageClientInterface;
  ClientConfig: ConfigInterface;
  execute(): Promise<void>;
}
