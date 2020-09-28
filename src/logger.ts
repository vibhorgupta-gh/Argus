import winston, { Logger as WinstonLogger } from 'winston';

// in order of priority
export const LogLevels = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
};

export class Logger {
  static createLogger(level: string): WinstonLogger {
    return winston.createLogger({
      // default to level info
      level:
        Object.values(LogLevels).indexOf(level) > -1 ? level : LogLevels.INFO,
      transports: [new winston.transports.Console()],
    });
  }
}
