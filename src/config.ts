import { SendMailOptions } from 'nodemailer';
import { SmtpOptions } from 'nodemailer-smtp-transport';
import {
  CliArgumentsInterface,
  ConfigInterface,
  DockerInitOptions,
  PromOptions,
} from './interfaces';

export class Config implements ConfigInterface {
  runOnce: boolean;
  cleanImage: boolean;
  dockerHost: string | undefined;
  watchInterval: number | undefined;
  containersToMonitor: string[] | null;
  containersToIgnore: string[] | null;
  repoUser: string | null;
  repoPass: string | null;
  emailConfig?: SmtpOptions;
  emailOptions?: SendMailOptions;
  webhookUrls?: string[] | undefined;
  pushoverAppToken?: string | undefined;
  pushoverUserKey?: string | undefined;
  pushoverDevice?: string | undefined;
  telegramBotToken?: string | undefined;
  telegramChatId?: string | undefined;
  prometheusConfig?: PromOptions;

  constructor({
    runonce,
    cleanup,
    host,
    interval,
    monitor,
    ignore,
    user,
    pass,
    smtpHost,
    smtpPort,
    smtpUsername,
    smtpPassword,
    smtpSender,
    smtpRecipients,
    webhookUrls,
    pushoverToken,
    pushoverUser,
    pushoverDevice,
    telegramToken,
    telegramChat,
    prometheusHost,
    prometheusPort,
  }: CliArgumentsInterface) {
    const toMonitor: string[] | undefined = monitor
      ? parseContainersToFilterInput(monitor)
      : [];
    const toIgnore: string[] | undefined = ignore
      ? parseContainersToFilterInput(ignore)
      : [];
    this.runOnce = runonce;
    this.cleanImage = cleanup;
    this.dockerHost = host;
    this.watchInterval = interval;
    this.containersToMonitor = toMonitor;
    this.containersToIgnore = toIgnore;
    this.repoUser = user || process.env.REPO_USER;
    this.repoPass = pass || process.env.REPO_PASS;
    this.emailConfig = {
      host: smtpHost || process.env.SMTP_HOST,
      port: Number(smtpPort || process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: smtpUsername || process.env.SMTP_USER,
        pass: smtpPassword || process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    };
    this.emailOptions = {
      from: smtpSender,
      to: parseEmailRecipients(smtpRecipients),
    };
    this.webhookUrls = parseWebhookUrlsInput(
      webhookUrls,
      !!(pushoverUser && pushoverToken && pushoverDevice),
      !!(telegramToken && telegramChat)
    );
    this.pushoverAppToken = pushoverToken;
    this.pushoverUserKey = pushoverUser;
    this.pushoverDevice = pushoverDevice;
    this.telegramBotToken = telegramToken;
    this.telegramChatId = telegramChat;
    this.prometheusConfig = null;
    if (
      validHttpUrl(prometheusHost || process.env.PROM_HOST) &&
      (prometheusPort || process.env.PROM_PORT)
    ) {
      this.prometheusConfig = {
        host: prometheusHost || process.env.PROM_HOST,
        port: Number(prometheusPort || process.env.PROM_PORT),
      };
    }
  }

  /**
   *  Return config object to initialize Docker Client according to available host
   *
   * @return {*}  {DockerInitOptions}
   * @memberof Config
   * @return {DockerInitOptions}
   */
  extractDockerConfig(): DockerInitOptions {
    const isValidUri: boolean = checkValidTCPUri(this.dockerHost);
    const dockerConfig: DockerInitOptions = isValidUri
      ? { host: this.dockerHost }
      : { socketPath: '/var/run/docker.sock' };
    return dockerConfig;
  }
}

/**
 * Model container names string (passed via CLI options) to array of names
 *
 * @param {(string | undefined)} containerstoMonitor
 * @return {(string[] | undefined)}
 */
function parseContainersToFilterInput(
  containerstoFilter: string | undefined
): string[] | undefined {
  if (!containerstoFilter) return undefined;
  return containerstoFilter.split(',');
}

function parseEmailRecipients(recipients: string | null): string[] | undefined {
  if (!recipients) return undefined;
  return recipients.split(',');
}

function parseWebhookUrlsInput(
  webhookUrls: string | null,
  broadcastToPuhshover: boolean,
  broadcastToTelegram: boolean
): string[] | undefined {
  if (!webhookUrls) return undefined;
  const parsedUrlsInput: string[] = webhookUrls.split(',');
  if (broadcastToPuhshover)
    parsedUrlsInput.push('https://api.pushover.net/1/messages.json');
  if (broadcastToTelegram) parsedUrlsInput.push('https://api.telegram.org/bot');

  return parsedUrlsInput.filter((url) => validHttpUrl(url));
}

/**
 * Checks whether user specified URI is a valid TCP URI
 *
 * @param {string} hostUri
 * @return {boolean}
 */
function checkValidTCPUri(hostUri: string): boolean {
  const regexForValidTCP = new RegExp(
    '^(?:tcp)s?://(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\\.)+(?:[A-Z]{2,6}\\.?|[A-Z0-9-]{2,}\\.?)|localhost|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})(?::\\d+)?(?:/?|[/?]\\S+)$'
  );
  return regexForValidTCP.test(hostUri);
}

const validHttpUrl: (url: string) => boolean = (url: string) => {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ); // fragment locator
  return !!pattern.test(url);
};
