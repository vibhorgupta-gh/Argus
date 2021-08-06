import {
  Image as ImageInterface,
  ImageInspectInfo,
  ImageInfo,
} from 'dockerode';
import { clean, coerce, valid, rcompare, major, minor, patch } from 'semver';
import {
  ImageClientInterface,
  ConfigInterface,
  RegistryInterface,
  PullAuthInterface,
} from './interfaces';
import { Registry } from './registry';
import chalk from 'chalk';
import { logger } from './logger';

const LATEST_TAG = 'latest';

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
      logger.error(`List images error: ${err.message}`);
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
      logger.error(`Inspect images error: ${err.message}`);
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
    imageName: string | undefined,
    imageTag: string | undefined,
    config: ConfigInterface
  ): Promise<ImageInspectInfo | undefined> {
    // Credentials for private repo auth
    let pullAuthCredentials: PullAuthInterface | undefined;
    if (config.repoUser && config.repoPass) {
      pullAuthCredentials = {
        username: config.repoUser,
        password: config.repoPass,
      };
    }

    try {
      const latestName = `${imageName}:${imageTag}`;
      if (!imageName || !imageTag) {
        throw new Error(
          `Invalid image name or tag. Name: ${imageName} Tag: ${imageTag}`
        );
      }
      const authCredentials = pullAuthCredentials
        ? { pullAuthCredentials }
        : {};

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
        logger.debug(
          `Container already running for the latest image: ${err.message}`
        );
      } else {
        console.log(chalk.red(`Pull latest image error: ${err}`), `\n`);
        logger.error(`Pull latest images error: ${err.message}`);
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
      logger.debug(`Removed image ${imageName}`);
    } catch (err) {
      console.log(chalk.red(`Remove image error: ${err}`));
      logger.error(`Remove image error: ${err.message}`);
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
  static shouldUpdateCurrentImage(oldSha: string, newSha: string): boolean {
    return !(newSha === oldSha);
  }

  /**
   * Gets the name of the image without its tags. Useful to determine image name for an updated tag
   *
   * @param {string} name - Name of the image (with tag)
   * @return {string|undefined}
   */
  getUntaggedImageName(name: string): string | undefined {
    if (!name) {
      return;
    }
    return name.split(':')[0];
  }

  /**
   * Gets the tag of the image
   *
   * @param {string} name - Name of the image (with tag)
   * @return {string|undefined}
   */
  getImageTag(name: string): string | undefined {
    if (!name) {
      return;
    }
    return name.split(':')[1];
  }

  /**
   *
   * @param {ImageInspectInfo} image - Image of the container
   * @param {string|undefined} currentTag - Tag of the current image
   * @param config
   * @return {Promise<string | undefined>} - Most recent tag in the image repository according to user constraints
   */
  static async fetchUpdatedImageTag(
    image: ImageInspectInfo,
    currentTag: string | undefined,
    config: ConfigInterface
  ): Promise<string | undefined> {
    // If semver update is not enabled, we default to <:latest> tag
    if (!config.semverUpdate) {
      return Promise.resolve(LATEST_TAG);
    }

    const repoName: string = Image.getRepositoryName(image);
    if (!repoName) return;

    // Initialize registry client and fetch image tags
    const registryClient: RegistryInterface = new Registry(config);
    const repoTags: string[] = await registryClient.getRepositoryTags(repoName);
    if (!repoTags || !repoTags.length) return;

    // filter valid tags - tags respecting semver conventions
    const validTags: string[] = repoTags.filter((tag) =>
      valid(coerce(clean(tag)))
    );

    if (!validTags.length) {
      console.log(
        chalk.yellow(
          `No valid semver tags found for ${repoName}. Trying with 'latest' tag instead.`
        )
      );
      logger.info(
        `No valid semver tags found for ${repoName}. Trying with 'latest' tag instead.`
      );
      return Promise.resolve(LATEST_TAG);
    }
    if (config.allowMajorUpdate) {
      return Image.getMajorUpdateTag(currentTag, validTags);
    }
    if (config.patchOnly) {
      return Image.getPatchUpdateTag(currentTag, validTags);
    }
    return Image.getMinorAndPatchUpdateTag(currentTag, validTags);
  }

  private static getRepositoryName(
    image: ImageInspectInfo | undefined
  ): string | undefined {
    if (!image) return undefined;
    const repoDigest: string = image.RepoDigests[0];
    return repoDigest.split('@sha256:')[0];
  }

  private static getMajorUpdateTag(currentTag: string, tags: string[]): string {
    if (!valid(currentTag)) {
      return Image.findRecentUpdate(tags);
    }
    const tagsWithHigherMajorVersion: string[] = tags.filter(
      (tag) => major(tag) > major(currentTag)
    );

    if (!tagsWithHigherMajorVersion.length) {
      return Image.getMinorAndPatchUpdateTag(currentTag, tags);
    }

    const comparator = function (tag1: string, tag2: string): number {
      if (major(tag1) < major(tag2)) return 1;
      if (major(tag1) > major(tag2)) return -1;
      if (major(tag1) === major(tag1)) {
        if (minor(tag1) < minor(tag2)) return 1;
        if (minor(tag1) > minor(tag2)) return -1;
      }
      if (major(tag1) === major(tag2) && minor(tag1) === minor(tag2)) {
        if (patch(tag1) < patch(tag2)) return 1;
        if (patch(tag1) > patch(tag2)) return -1;
      }
      if (
        major(tag1) === major(tag2) &&
        minor(tag1) === minor(tag2) &&
        patch(tag1) === patch(tag2)
      ) {
        return 0;
      }
      return 0;
    };
    tagsWithHigherMajorVersion.sort(comparator);

    return tagsWithHigherMajorVersion[0];
  }

  private static getPatchUpdateTag(currentTag: string, tags: string[]): string {
    if (!valid(currentTag)) {
      return Image.findRecentUpdate(tags);
    }
    const tagsWithSameMajorMinorVersion: string[] = tags.filter(
      (tag) =>
        major(tag) === major(currentTag) && minor(tag) === minor(currentTag)
    );

    const comparator = function (tag1: string, tag2: string): number {
      if (patch(tag1) < patch(tag2)) return 1;
      if (patch(tag1) > patch(tag2)) return -1;
      return 0;
    };
    tagsWithSameMajorMinorVersion.sort(comparator);

    return tagsWithSameMajorMinorVersion[0];
  }

  private static getMinorAndPatchUpdateTag(
    currentTag: string,
    tags: string[]
  ): string {
    if (!valid(currentTag)) {
      return Image.findRecentUpdate(tags);
    }
    const tagsWithSameMajorVersion: string[] = tags.filter(
      (tag) => major(tag) === major(currentTag)
    );

    const comparator = function (tag1: string, tag2: string): number {
      if (
        minor(tag1) < minor(tag2) ||
        (minor(tag1) === minor(tag2) && patch(tag1) < patch(tag2))
      ) {
        return 1;
      }
      if (
        minor(tag1) > minor(tag2) ||
        (minor(tag1) === minor(tag2) && patch(tag1) > patch(tag2))
      ) {
        return -1;
      }
      return 0;
    };
    tagsWithSameMajorVersion.sort(comparator);

    return tagsWithSameMajorVersion[0];
  }

  private static findRecentUpdate(tags: string[]): string {
    if (!tags.length) return LATEST_TAG;
    const sortedTags: string[] = tags.sort(rcompare);
    return sortedTags[0];
  }
}
