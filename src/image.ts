
import Docker from 'dockerode';

let DockerClient = new Docker();


export class Image {

  static async listAll () {
    try {
      const list = await DockerClient.listImages();
      return list;
    }
    catch (err) {
      console.log(`List images error: ${err.message}`);
    }
  }

}
