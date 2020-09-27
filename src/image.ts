import { Image as ImageInterface, ImageInspectInfo, ImageInfo } from 'dockerode';


export class Image {

  client: any;

  constructor (client: any) {
    this.client = client;
  }

  async listAll () : Promise<ImageInfo[] | undefined>{
    try {
      const imageList:ImageInfo[] = await this.client.listImages();
      return imageList;
    }
    catch (err) {
      console.log(`List images error: ${err.message}`);
      return;
    }
  }

 async inspect (name: string) : Promise<ImageInspectInfo | undefined> {
    try {
      const image:ImageInterface = await this.client.getImage(name);
      const imageInfo:ImageInspectInfo = await image.inspect();
      return imageInfo;
    }
    catch (err) {
      console.log(`Inspect images error: ${err.message}`);
      return;
    }
  }

  async pullLatestImage (image: ImageInspectInfo) : Promise<ImageInspectInfo | undefined> {
    try {
      const latestName:string = `${image.RepoTags[0].split(':')[0]}:latest`;
      await this.client.pull(latestName);
      return await this.inspect(latestName);
    }
    catch (err) {
      console.log(`Pull latest image error: ${err.message}`);
      return;
    }
  }

  static isUpdatedImage (oldSha: string, newSha: string) : boolean {
    return (newSha === oldSha);
  }
}
