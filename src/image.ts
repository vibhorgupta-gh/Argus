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

  /**
   * Gets list of all images (except dangling) for current Docker client
   *
   * @return {(Promise<ImageInfo[] | undefined>)}
   * @memberof Image
   */
  async listAll(): Promise<ImageInfo[] | undefined> {
    try {
      const imageList: ImageInfo[] = await this.client.listImages();
      return imageList;
    } catch (err) {
      console.log(chalk.red(`List images error: ${err.message}`));
      return;
    }
  }

  /**
   * Returns a inspectable details object type for specified image name to inspect
   *
   * @param {string} name - Name of the image to inspect
   * @return {(Promise<ImageInspectInfo | undefined>)}
   * @memberof Image
   */
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

  /**
   * Checks for 'latest' tag of current image in the remote repository. If found, pulls latest tagged image.
   * Also supports private image registries, provided credentials are correct
   *
   * @param {ImageInspectInfo} image - The potentially outdated image that needs latest pull
   * @param {(PullAuthInterface | undefined)} authconfig - Credentials for private image registry
   * @return {(Promise<ImageInspectInfo | undefined>)}
   * @memberof Image
   */
  async pullLatestImage(
    image: ImageInspectInfo,
    authconfig: PullAuthInterface | undefined
  ): Promise<ImageInspectInfo | undefined> {
    try {
      const latestName = `${image.RepoTags[1].split(':')[0]}:latest`;
      const authCredentials = authconfig ? { authconfig } : {};

      return new Promise((resolve, reject) => {
        this.client.pull(
          latestName,
          authCredentials,
          (err: any, stream: any) => {
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
          }
        );
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

  /**
   * Deletes the specified image
   *
   * @param {ImageInspectInfo} image - Image object to remove
   * @return {Promise<void>}
   * @memberof Image
   */
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

  /**
   * Checks whether old and new image hashes are equal.
   * Equality means current image is already at latest tag, inequality signifies a fresh pull of latest version is required
   *
   * @static
   * @param {string} oldSha - SHA hashed ID of old image
   * @param {string} newSha - SHA hashed ID of latest image
   * @return {boolean}
   * @memberof Image
   */
  static isUpdatedImage(oldSha: string, newSha: string): boolean {
    return newSha === oldSha;
  }
}
