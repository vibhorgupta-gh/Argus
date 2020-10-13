#!/usr/bin/env node

import yargs = require('yargs/yargs');
import figlet from 'figlet';
import chalk from 'chalk';
import executeArgus from './script';
import { Arguments } from './interfaces';
import { Config } from './config';


const argv: Arguments = yargs(process.argv.slice(2))
  .option('runonce', {
    alias: 'r',
    description: 'Run Argus once and exit',
    type: 'boolean',
    default: false
  })
  .option('cleanup', {
    alias: 'c',
    description: 'Remove outdated images after updating container',
    type: 'boolean',
    default: false
  })
  .option('host', {
    alias: 'u',
    description: 'Url for tcp host. Defaults to "unix://var/run/docker.sock',
    type: 'string',
    default: 'unix://var/run/docker.sock'
  })
  .option('interval', {
    alias: 'i',
    description: 'Interval between Argus checking for updates. Defaults to 300 seconds',
    type: 'number',
    default: 300
  })
  .option('monitor', {
    alias: 'm',
    description: 'Specify containers (by name) to monitor. Defaults to all containers',
    type: 'array',
    default: []
  })
  .help()
  .alias('help', 'h')
  .argv;

const config = new Config(argv);
console.log(config);

console.log(
  chalk.red(figlet.textSync('Argus', { horizontalLayout: 'fitted' })),
  `\n\n`
);

setInterval(() => {
  executeArgus();
}, 15000);

executeArgus();

