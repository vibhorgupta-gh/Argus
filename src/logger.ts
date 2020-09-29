import winston, { format, transports, Logger as WinstonLogger } from 'winston';
const { combine, timestamp, label, printf } = format;

const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

class Logger {
  static createLogger(): WinstonLogger {
    return winston.createLogger({
      format: combine(label({ label: 'Argus' }), timestamp(), customFormat),
      levels: winston.config.syslog.levels,
      transports: [new transports.Console()],
    });
  }
}

export const logger = Logger.createLogger();
