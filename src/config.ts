import { Arguments, ConfigInterface } from './interfaces';

export class Config implements ConfigInterface {
  runOnce: boolean;
  cleanImages: boolean;
  dockerHost: string | undefined;
  watchInterval: number | undefined;
  containersToMonitor: string[] | undefined;

  constructor({
    argArr,
    runonce,
    cleanup,
    host,
    interval,
    monitor,
    fileName,
  }: Arguments) {
    const toMonitor: string[] | undefined = monitor
      ? parseContainersToMonitorInput(monitor)
      : [];
    this.runOnce = runonce;
    this.cleanImages = cleanup;
    this.dockerHost = host;
    this.watchInterval = interval;
    this.containersToMonitor = toMonitor;
  }
}

function parseContainersToMonitorInput(
  containerstoMonitor: string | undefined
): string[] | undefined {
  return containerstoMonitor.split(',');
}
