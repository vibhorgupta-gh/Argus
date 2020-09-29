import Docker, {
  Container as ContainerInterface,
  ContainerCreateOptions,
  ContainerInfo,
  ContainerInspectInfo,
  HostConfig,
  Image as ImageInterface,
  ImageInspectInfo,
  ImageInfo,
} from 'dockerode';

import figlet from 'figlet';
import chalk from 'chalk';

import { Image } from './image';
import { Container, RunningContainerInfo } from './container';

const DockerClient = new Docker();
const ContainerClient = new Container(DockerClient);
const ImageClient = new Image(DockerClient);

async function executeArgus(): Promise<void> {
  const containers:
    | RunningContainerInfo[]
    | undefined = await ContainerClient.getRunningContainers();

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
        | undefined = await ImageClient.inspect(
        containerInspect.Config['Image']
      );
      let latestImage: ImageInspectInfo | undefined;

      try {
        console.log(
          chalk.yellow('Pulling latest image from registry...'),
          `\n`
        );
        latestImage = await ImageClient.pullLatestImage(currentImage);
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
          | undefined = await ContainerClient.create(newConfig);
        await Container.start(newContainer);
        count += 1;
      }
    }
    console.log(chalk.green(`${count} containers updated.`), `\n\n\n\n`);
  }
}

console.log(
  chalk.red(figlet.textSync('Argus', { horizontalLayout: 'fitted' })),
  `\n\n`
);

setInterval(() => {
  executeArgus();
}, 15000);

executeArgus();
