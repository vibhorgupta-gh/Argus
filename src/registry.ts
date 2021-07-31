import { getTags } from '@snyk/docker-registry-v2-client';
import { RegistryInterface, RegistryOpts, ConfigInterface } from './interfaces';
import chalk from 'chalk';
import { logger } from './logger';

const REGISTRY_BASE_V2 = 'registry-1.docker.io';

export class Registry implements RegistryInterface {
  private registryConfig: RegistryOpts;

  constructor(clientConfig: ConfigInterface) {
    this.registryConfig = {
      registryBase: REGISTRY_BASE_V2,
      repoUser: clientConfig.repoUser,
      repoPass: clientConfig.repoPass,
    };
  }

  /**
   * Fetches all tags for a given repository. Uses the Docker Registry API
   *
   * @param {string} repoName - Name of the repo where the image is hosted
   * @return {Promise<string[] | undefined>}
   */
  async getRepositoryTags(repoName: string): Promise<string[] | undefined> {
    if (!repoName) return;
    try {
      const repoTags: string[] = await getTags(
        this.registryConfig.registryBase,
        repoName,
        this.registryConfig.repoUser,
        this.registryConfig.repoPass
      );
      return repoTags;
    } catch (err) {
      console.log(chalk.red(`Registry client error: ${err.message}`));
      logger.error(`Registry client error: ${err.message}`);
      return;
    }
  }
}
