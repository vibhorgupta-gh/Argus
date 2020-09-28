import Docker from 'dockerode';
import { Image } from './image';
import { Container } from './container';
import { Logger, LogLevels } from './logger';

const DockerClient = new Docker();
const ContainerClient = new Container(DockerClient);
const logger = Logger.createLogger(LogLevels.INFO);

async function executeArgus(): Promise<void> {
  logger.info('Fetching containers...');
  const containers = await ContainerClient.getRunningContainers();
}

executeArgus();
