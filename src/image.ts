import {
  Image as ImageInterface,
  ImageInspectInfo,
  ImageInfo,
} from 'dockerode';
import { ImageClientInterface, PullAuthInterface } from './interfaces';
import chalk from 'chalk';

export class Image implements ImageClientInterface {
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
    image: ImageInspectInfo,
    authconfig: PullAuthInterface | undefined
  ): Promise<ImageInspectInfo | undefined> {
    try {
      const latestName = `${image.RepoTags[1].split(':')[0]}:latest`;
      const auth = authconfig ? { authconfig } : {};

      return new Promise((resolve, reject) => {
        this.client.pull(latestName, auth, (err: any, stream: any) => {
          this.client.modem.followProgress(
            stream,
            async (err: any, output: any) => {
              if (err) {
                reject(err);
              }
              try {
                const inspectObject: ImageInspectInfo = await this.inspect(
                  latestName
                );
                resolve(inspectObject);
              } catch (e) {
                reject(e);
              }
            }
          );
        });
      });
    } catch (err) {
      if (err instanceof TypeError) {
        console.log(`Container already running for the latest image.\n`);
      } else {
        console.log(chalk.red(`Pull latest image error: ${err}`), `\n`);
      }
      return;
    }
  }

  async remove(image: ImageInspectInfo): Promise<void> {
    try {
      // TODO: Delete by id? (Docker engine supports, but dockerode API might not)
      const imageName: string = image.RepoTags[image.RepoTags.length - 1];
      const imageObject: ImageInterface = await this.client.getImage(imageName);
      await imageObject.remove();
      console.log(chalk.cyan(`Removed image ${imageName}`));
    } catch (err) {
      console.log(chalk.red(`remove image error: ${err}`));
    }
  }

  static isUpdatedImage(oldSha: string, newSha: string): boolean {
    return newSha === oldSha;
  }
}
