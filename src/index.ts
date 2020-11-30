#!/usr/bin/env node

import process from 'process';
import Docker from 'dockerode';
import yargs = require('yargs/yargs');
import figlet from 'figlet';
import chalk from 'chalk';
import { Image } from './image';
import { Container } from './container';
import { Client } from './client';
import {
  CliArgumentsInterface,
  ConfigInterface,
  DockerInitOptions,
  ContainerClientInterface,
  ImageClientInterface,
} from './interfaces';
import { Config } from './config';

const argv: CliArgumentsInterface = yargs(process.argv.slice(2))
  .option('runonce', {
    alias: 'r',
    description: 'Run Argus once and exit',
    type: 'boolean',
    default: false,
  })
  .option('cleanup', {
    alias: 'c',
    description: 'Remove outdated images after updating container',
    type: 'boolean',
    default: false,
  })
  .option('host', {
    alias: 'u',
    description:
      'Url for tcp host. Defaults to local socket -> unix://var/run/docker.sock',
    type: 'string',
    default: '/var/run/docker.sock',
  })
  .option('interval', {
    alias: 'i',
    description:
      'Interval between Argus checking for updates. Defaults to 300 seconds',
    type: 'number',
    default: 300,
  })
  .option('monitor', {
    alias: 'm',
    description:
      'Specify containers (by name) to monitor. Defaults to all containers',
    type: 'string',
    default: null,
  })
  .help()
  .alias('help', 'h').argv;

// Set configs and clients
const ClientConfig: ConfigInterface = new Config(argv);

// Initialize docker client
let DockerClient: any;
try {
  const dockerOptions: DockerInitOptions = ClientConfig.extractDockerConfig();
  DockerClient = new Docker(dockerOptions);
} catch (e) {
  console.error(e);
  process.exit(1);
}

// Initialize container and image clients
const ContainerClient: ContainerClientInterface = new Container(DockerClient);
const ImageClient: ImageClientInterface = new Image(DockerClient);

// Initialize executor client
const Argus = new Client(
  DockerClient,
  ContainerClient,
  ImageClient,
  ClientConfig
);

// Run Argus
(() => {
  console.log(
    chalk.red(figlet.textSync('Argus', { horizontalLayout: 'fitted' })),
    `\n\n`
  );

  if (!ClientConfig.runOnce) {
    setInterval(() => {
      Argus.execute();
    }, ClientConfig.watchInterval * 1000);
  }
  Argus.execute();
})();
