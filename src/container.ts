import Docker from 'dockerode';

let DockerClient = new Docker();


export class Container {

  name: string;
  image: string;
  command: any;
  hostConfig: object;
  labels: any;
  entrypoint: string;
  environment: any;

  constructor (options: object) {
    let opts:any = options;

    this.name = opts.name;
    this.image = opts.image;
    this.command = opts.command;
    this.hostConfig = opts.hostConfig;
    this.labels = opts.labels;
    this.entrypoint = opts.entrypoint;
    this.environment = opts.environment;
  }

  async create () {
    try {
      const container = await DockerClient.createContainer({
        Image: this.image,
        Cmd: this.command,
        HostConfig: this.hostConfig,
        Labels: this.labels,
        Entrypoint: this.entrypoint
      })
      return container;
    }
    catch (err) {
      console.log(`create container error: ${err}`);
    }
  }

  static async start (container: any) {
    try {
      const data = await container.start();
      console.log(`Started container ${container['Id']}`);
    }
    catch (err) {
      console.log(`start container error: ${err}`);
    }
  }

  static async stop (container: any) {
    try {
      const data = await container.stop();
      console.log(`Stopped container: ${data['message']}`);
    }
    catch (err) {
      console.log(`stop container error: ${err}`);
    }
  }


  static async remove (container: any) {
    try {
      const data = await container.remove();
      console.log(`Removed container: ${data['message']}`);
    }
    catch (err) {
      console.log(`remove container error: ${err}`);
    }
  }

}


