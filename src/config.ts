import {
  CliArgumentsInterface,
  ConfigInterface,
  DockerInitOptions,
} from './interfaces';

export class Config implements ConfigInterface {
  runOnce: boolean;
  cleanImage: boolean;
  dockerHost: string | undefined;
  watchInterval: number | undefined;
  containersToMonitor: string[] | null;
  repoUser: string | null;
  repoPass: string | null;

  constructor({
    runonce,
    cleanup,
    host,
    interval,
    monitor,
    user,
    pass,
  }: CliArgumentsInterface) {
    const toMonitor: string[] | undefined = monitor
      ? parseContainersToMonitorInput(monitor)
      : [];
    this.runOnce = runonce;
    this.cleanImage = cleanup;
    this.dockerHost = host;
    this.watchInterval = interval;
    this.containersToMonitor = toMonitor;
    this.repoUser = user || process.env.REPO_USER;
    this.repoPass = pass || process.env.REPO_PASS;
  }

  extractDockerConfig(): DockerInitOptions {
    const isValidUri: boolean = checkValidTCPUri(this.dockerHost);
    const dockerConfig: DockerInitOptions = isValidUri
      ? { host: this.dockerHost }
      : { socketPath: '/var/run/docker.sock' };
    return dockerConfig;
  }
}

function parseContainersToMonitorInput(
  containerstoMonitor: string | undefined
): string[] | undefined {
  return containerstoMonitor.split(',');
}

function checkValidTCPUri(hostUri: string): boolean {
  const regexForValidTCP = new RegExp(
    '^(?:tcp)s?://(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\\.)+(?:[A-Z]{2,6}\\.?|[A-Z0-9-]{2,}\\.?)|localhost|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})(?::\\d+)?(?:/?|[/?]\\S+)$'
  );
  return regexForValidTCP.test(hostUri);
}
