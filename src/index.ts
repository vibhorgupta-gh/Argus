#!/usr/bin/env node

import Docker from 'dockerode';
import yargs = require('yargs/yargs');
import figlet from 'figlet';
import chalk from 'chalk';
import { Image } from './image';
import { Container } from './container';
import { NotificationService } from './notifications';
import { DataService } from './metrics';
import { Client } from './client';
import {
  CliArgumentsInterface,
  ConfigInterface,
  DockerInitOptions,
  ContainerClientInterface,
  ImageClientInterface,
  NotificationInterface,
  DataServiceInterface,
} from './interfaces';
import { Config } from './config';
import { Logger, logger } from './logger';

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
  .option('ignore', {
    alias: 'ig',
    description: 'Specify containers (by name) to ignore. Defaults to none',
    type: 'string',
    default: null,
  })
  .option('user', {
    alias: 'u',
    description:
      'Username for private image registry. Defaults to Docker Hub if not specified',
    type: 'string',
    default: null,
  })
  .option('pass', {
    alias: 'p',
    description:
      'Password for private image registry. Defaults to Docker Hub if not specified',
    type: 'string',
    default: null,
  })
  .option('smtp-host', {
    alias: 'H',
    description: 'SMTP relay hostname',
    type: 'string',
    default: null,
  })
  .option('smtp-port', {
    alias: 'I',
    description: 'SMTP relay port number',
    type: 'string',
    default: null,
  })
  .option('smtp-username', {
    alias: 'U',
    description: 'SMTP relay username',
    type: 'string',
    default: null,
  })
  .option('smtp-password', {
    alias: 'G',
    description: 'SMTP relay password',
    type: 'string',
    default: null,
  })
  .option('smtp-sender', {
    alias: 'j',
    description: 'SMTP notification sender email account',
    type: 'string',
    default: null,
  })
  .option('smtp-recipients', {
    alias: 'J',
    description: 'Recipents of SMTP notification',
    type: 'string',
    default: null,
  })
  .option('webhook-urls', {
    alias: 'w',
    description:
      'Specify comma separated Webhook POST urls to broadcast notifications',
    type: 'string',
    default: null,
  })
  .option('pushover-token', {
    alias: 'pt',
    description: 'Specify Pushover app token to broadcast notifications to',
    type: 'string',
    default: null,
  })
  .option('pushover-user', {
    alias: 'pu',
    description: 'Specify Pushover user key to broadcast notifications to',
    type: 'string',
    default: null,
  })
  .option('pushover-device', {
    alias: 'pd',
    description: 'Specify Pushover device to broadcast notifications to',
    type: 'string',
    default: null,
  })
  .option('telegram-token', {
    alias: 'tt',
    description:
      'Specify token for your Telegram bot to broadcast notifications to',
    type: 'string',
    default: null,
  })
  .option('telegram-chat', {
    alias: 'tc',
    description: 'Specify Telegram chat ID to broadcast notifications to',
    type: 'string',
    default: null,
  })
  .option('prometheus-host', {
    alias: 'ph',
    description:
      'Specify server hostname for Prometheus to scrape metrics from',
    type: 'string',
    default: null,
  })
  .option('prometheus-port', {
    alias: 'pi',
    description: 'Specify server port for Prometheus to scrape metrics from',
    type: 'string',
    default: null,
  })
  .option('influx-url', {
    alias: 'iu',
    description: 'Specify url where InfluxDB is exposed',
    type: 'string',
    default: null,
  })
  .option('influx-token', {
    alias: 'it',
    description: 'Specify InfluxDB auth token for your organisation',
    type: 'string',
    default: null,
  })
  .option('influx-org', {
    alias: 'io',
    description: 'Specify InfluxDB organisation',
    type: 'string',
    default: null,
  })
  .option('influx-bucket', {
    alias: 'ib',
    description: 'Specify InfluxDB bucket for your organisation',
    type: 'string',
    default: null,
  })
  .option('private-registry', {
    alias: 'reg',
    description: 'Base URL to a private image registry.',
    type: 'string',
    default: 'registry-1.docker.io',
  })
  .option('semver-update', {
    alias: 'sv',
    description: 'Allow updates according to semantically versioned images',
    type: 'boolean',
    default: false,
  })
  .option('patch-only', {
    alias: 'po',
    description: 'Only updates to latest patch release',
    type: 'boolean',
    default: false,
  })
  .help()
  .alias('help', 'h').argv;

// Set configs and clients
const ClientConfig: ConfigInterface = new Config(argv);

//Initialze logger
new Logger();

// Initialize docker client
let DockerClient: any;
try {
  const dockerOptions: DockerInitOptions = ClientConfig.extractDockerConfig();
  DockerClient = new Docker(dockerOptions);
} catch (err) {
  console.error(err);
  logger.crit(`Can't connect to the Docker API. ${err.message}`);
  process.exit(1);
}

// Initialize clients
const DataClient: DataServiceInterface | null = new DataService(ClientConfig);
const ContainerClient: ContainerClientInterface = new Container(DockerClient);
const ImageClient: ImageClientInterface = new Image(DockerClient);
let NotificationClient: NotificationInterface | undefined;

// Display figlet on console
console.log(
  chalk.red(figlet.textSync('Argus', { horizontalLayout: 'fitted' })),
  `\n\n`
);

try {
  NotificationClient = new NotificationService(ClientConfig, DataClient);
} catch (err) {
  NotificationClient = undefined;
  console.log(chalk.red(`${err.message}`));
  logger.error(`Notification client error: ${err.message}`);
}

// Initialize executor client
const Argus = new Client(
  DockerClient,
  ContainerClient,
  ImageClient,
  NotificationClient,
  DataClient,
  ClientConfig
);

// Run Argus
(() => {
  if (!ClientConfig.runOnce) {
    setInterval(() => {
      Argus.execute();
    }, ClientConfig.watchInterval * 1000);
  }

  Argus.execute();
})();
