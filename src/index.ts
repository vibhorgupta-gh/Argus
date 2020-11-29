#!/usr/bin/env node

import Docker from 'dockerode';
import yargs = require('yargs/yargs');
import figlet from 'figlet';
import chalk from 'chalk';
import { Image } from './image';
import { Container } from './container';
import { Client } from './client';
import {
  Arguments,
  ConfigInterface,
  ContainerClientInterface,
  ImageClientInterface,
} from './interfaces';
import { Config } from './config';

const argv: Arguments = yargs(process.argv.slice(2))
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
    description: 'Url for tcp host. Defaults to "unix://var/run/docker.sock',
    type: 'string',
    default: 'unix://var/run/docker.sock',
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
    type: 'array',
    default: [],
  })
  .help()
  .alias('help', 'h').argv;

// Set configs and clients
const ClientConfig: ConfigInterface = new Config(argv);
const DockerClient = new Docker();
const ContainerClient: ContainerClientInterface = new Container(DockerClient);
const ImageClient: ImageClientInterface = new Image(DockerClient);

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
