import Docker, { Container as ContainerInterface, ContainerCreateOptions, HostConfig } from 'dockerode';

let DockerClient = new Docker();


export class Container {

  name: string | undefined;
  image: string | undefined;
  command: string[] | undefined;
  hostConfig: HostConfig | undefined;
  labels: { [label: string]: string } | undefined;
  entrypoint: string | string [] | undefined;
  environment: any;


  constructor (opts: ContainerCreateOptions) {

    this.name = opts.name;
    this.image = opts.Image;
    this.command = opts.Cmd;
    this.hostConfig = opts.HostConfig;
    this.labels = opts.Labels;
    this.entrypoint = opts.Entrypoint;
    this.environment = opts.Env;
  }

  async create () : Promise<ContainerInterface | undefined> {
    let container: ContainerInterface;
    try {
      const createOpts: ContainerCreateOptions = {
        name: this.name,
        Image: this.image,
        Cmd: this.command,
        HostConfig: this.hostConfig,
        Labels: this.labels,
        Entrypoint: this.entrypoint
      }
      container = await DockerClient.createContainer(createOpts);
      return container;
    }
    catch (err) {
      console.log(`create container error: ${err}`);
      return;
    }
  }

  static async start (container: any) : Promise<void> {
    try {
      const data = await container.start();
      console.log(`Started container ${container['Id']}`);
    }
    catch (err) {
      console.log(`start container error: ${err}`);
    }
  }

  static async stop (container: any) : Promise<void> {
    try {
      const data = await container.stop();
      console.log(`Stopped container: ${data['message']}`);
    }
    catch (err) {
      console.log(`stop container error: ${err}`);
    }
  }


  static async remove (container: any) : Promise<void> {
    try {
      const data = await container.remove();
      console.log(`Removed container: ${data['message']}`);
    }
    catch (err) {
      console.log(`remove container error: ${err}`);
    }
  }

}


