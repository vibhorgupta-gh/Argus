import {
  Container as ContainerInterface,
  ContainerCreateOptions,
  ContainerInspectInfo,
  ImageInspectInfo,
} from 'dockerode';
import {
  RunningContainerInfo,
  ConfigInterface,
  ContainerClientInterface,
  ImageClientInterface,
  ArgusClientInterface,
} from './interfaces';
import { Image } from './image';
import { Container } from './container';
import chalk from 'chalk';

export class Client implements ArgusClientInterface {
  DockerClient: any;
  ContainerClient: ContainerClientInterface;
  ImageClient: ImageClientInterface;
  ClientConfig: ConfigInterface;

  constructor(
    DockerClient: any,
    ContainerClient: ContainerClientInterface,
    ImageClient: ImageClientInterface,
    ClientConfig: ConfigInterface
  ) {
    this.DockerClient = DockerClient;
    this.ContainerClient = ContainerClient;
    this.ImageClient = ImageClient;
    this.ClientConfig = ClientConfig;
  }

  async execute(): Promise<void> {
    const containers:
      | RunningContainerInfo[]
      | undefined = await this.ContainerClient.getRunningContainers();

    if (containers.length == 0) {
      console.log(`\n`, chalk.yellow('No running containers'), `\n\n`);
    } else {
      let count = 0;

      for (const containerObject of containers) {
        const containerInspect: ContainerInspectInfo =
          containerObject.inspectObject;
        const containerInterface: ContainerInterface =
          containerObject.interfaceObject;
        console.log(
          chalk.cyan(
            `Container to be updated: ${containerInspect['Name'].replace(
              '/',
              ''
            )}`
          ),
          `\n`
        );

        console.log(chalk.yellow('Checking locally for current image...'));
        const currentImage:
          | ImageInspectInfo
          | undefined = await this.ImageClient.inspect(
          containerInspect.Config['Image']
        );
        let latestImage: ImageInspectInfo | undefined;

        try {
          console.log(
            chalk.yellow('Pulling latest image from registry...'),
            `\n`
          );
          latestImage = await this.ImageClient.pullLatestImage(currentImage);
          if (!latestImage) {
            continue;
          }
        } catch (err) {
          console.log(chalk.red(`Docker API error: ${err.message}`));
          console.log('enter');
          continue;
        }

        if (!Image.isUpdatedImage(currentImage['Id'], latestImage['Id'])) {
          const newConfig: ContainerCreateOptions = Container.newContainerConfig(
            containerInspect,
            latestImage.RepoTags[0]
          );
          await Container.stop(containerInterface);
          await Container.remove(containerInterface);
          const newContainer:
            | ContainerInterface
            | undefined = await this.ContainerClient.create(newConfig);
          await Container.start(newContainer);
          count += 1;
        }
      }
      console.log(chalk.green(`${count} containers updated.`), `\n\n\n\n`);
    }
  }
}
