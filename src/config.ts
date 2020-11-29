import { Arguments, ConfigInterface } from './interfaces';

export class Config implements ConfigInterface {
  runOnce: boolean;
  cleanImages: boolean;
  dockerHost: string | undefined;
  watchInterval: number | undefined;
  containersToMonitor: (string | number)[] | undefined;

  constructor({
    argArr,
    runonce,
    cleanup,
    host,
    interval,
    monitor,
    fileName,
  }: Arguments) {
    this.runOnce = runonce;
    this.cleanImages = cleanup;
    this.dockerHost = host;
    this.watchInterval = interval;
    this.containersToMonitor = monitor;
  }
}
