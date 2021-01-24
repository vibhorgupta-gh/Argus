import { ImageInspectInfo, ContainerInspectInfo } from 'dockerode';
import { DataServiceInterface } from './interfaces';

export class DataService implements DataServiceInterface {
  public monitoredContainers: Map<string, number>;
  public updatedContainers: Map<string, number>;
  public updatedContainerObjects: [
    ImageInspectInfo,
    ImageInspectInfo,
    ContainerInspectInfo
  ][];

  constructor() {
    this.monitoredContainers = new Map();
    this.updatedContainers = new Map();
    this.updatedContainerObjects = [];
  }
}
