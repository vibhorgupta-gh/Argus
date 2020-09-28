import Docker from 'dockerode';
import { Image } from './image';
import { Container } from './container';

const DockerClient = new Docker();
const ContainerClient = new Container(DockerClient);

async function executeArgus(): Promise<void> {
  const containers = await ContainerClient.getRunningContainers();
}

executeArgus();
