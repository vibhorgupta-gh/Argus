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

import { Image } from './image';
import { Container, RunningContainerInfo } from './container';
import { Logger, LogLevels } from './logger';

const DockerClient = new Docker();
const ContainerClient = new Container(DockerClient);
const ImageClient = new Image(DockerClient);


async function executeArgus(): Promise<void> {
  const containers: RunningContainerInfo[] | undefined = await ContainerClient.getRunningContainers();

  if (containers.length == 0) {
    console.log('No running containers');

  } else {
    var count: number = 0;

    for (var containerObject of containers) {
      const containerInspect: ContainerInspectInfo = containerObject.inspectObject;
      const containerInterface: ContainerInterface = containerObject.interfaceObject;

      console.log('Checking locally for current image...')
      const currentImage: ImageInspectInfo | undefined = await ImageClient.inspect(containerInspect.Config['Image']);
      let latestImage: ImageInspectInfo | undefined;

      try {
        console.log('Pulling latest image from registry...')
        latestImage = await ImageClient.pullLatestImage(currentImage);
      } catch (err) {
        console.log(`Docker API error: ${err.message}`);
        continue;
      }

      if (!Image.isUpdatedImage(currentImage['Id'], latestImage['Id'])) {
        const newConfig: ContainerCreateOptions = Container.newContainerConfig(containerInspect, latestImage.RepoTags[0]);
        await Container.stop(containerInterface);
        await Container.remove(containerInterface);
        const newContainer: ContainerInterface | undefined = await ContainerClient.create(newConfig);
        await Container.start(newContainer);
        count += 1;
      }
    }
  }
}

executeArgus();
