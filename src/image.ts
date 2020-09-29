import {
  Image as ImageInterface,
  ImageInspectInfo,
  ImageInfo,
} from 'dockerode';
import chalk from 'chalk';

export class Image {
  client: any;

  constructor(client: any) {
    this.client = client;
  }

  async listAll(): Promise<ImageInfo[] | undefined> {
    try {
      const imageList: ImageInfo[] = await this.client.listImages();
      return imageList;
    } catch (err) {
      console.log(chalk.red(`List images error: ${err.message}`));
      return;
    }
  }

  async inspect(name: string): Promise<ImageInspectInfo | undefined> {
    try {
      const image: ImageInterface = await this.client.getImage(name);
      const imageInfo: ImageInspectInfo = await image.inspect();
      return imageInfo;
    } catch (err) {
      console.log(chalk.red(`Inspect images error: ${err.message}`));
      return;
    }
  }

  async pullLatestImage(
    image: ImageInspectInfo
  ): Promise<ImageInspectInfo | undefined> {
    try {
      const latestName = `${image.RepoTags[1].split(':')[0]}:latest`;
      await this.client.pull(latestName);
      await delay(6000);
      const inspectObject: ImageInspectInfo = await this.inspect(latestName);
      return inspectObject;
    } catch (err) {
      console.log(chalk.red(`Pull latest image error: ${err.message}`));
      return;
    }
  }

  static isUpdatedImage(oldSha: string, newSha: string): boolean {
    return newSha === oldSha;
  }
}

function delay(delayInms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, delayInms);
  });
}
