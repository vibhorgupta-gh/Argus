import { mkdirSync, existsSync } from 'fs';
import { level } from 'chalk';
import winston, { format, transports, Logger as WinstonLogger } from 'winston';
const { combine, timestamp, label, printf } = format;

const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

export class Logger {
  constructor() {
    // create log files
    const logDirName: string = __dirname + '/logs';
    if (!existsSync(logDirName)) mkdirSync(logDirName);
  }

  static createLogger(): WinstonLogger {
    const logDirName: string = __dirname + '/logs';
    return winston.createLogger({
      format: combine(label({ label: 'Argus' }), timestamp(), customFormat),
      levels: winston.config.syslog.levels,
      transports: [
        new transports.File({
          filename: `${logDirName}/info.log`,
          maxsize: 5242880,
          level: 'info',
          format: customFormat,
        }),
        new transports.File({
          filename: `${logDirName}/critical.log`,
          maxsize: 5242880,
          level: 'crit',
          format: customFormat,
        }),
        new transports.File({
          filename: `${logDirName}/error.log`,
          maxsize: 5242880,
          level: 'error',
          format: customFormat,
        }),
        new transports.File({
          filename: `${logDirName}/warn.log`,
          maxsize: 5242880,
          level: 'warn',
          format: customFormat,
        }),
        new transports.File({
          filename: `${logDirName}/debug.log`,
          maxsize: 5242880,
          level: 'debug',
          format: customFormat,
        }),
      ],
      exitOnError: false,
    });
  }
}

export const logger = Logger.createLogger();
