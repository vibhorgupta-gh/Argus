import chalk from 'chalk';
import axios from 'axios';
import { ImageInspectInfo, ContainerInspectInfo } from 'dockerode';
import {
  createTransport,
  Transporter,
  SendMailOptions,
  SentMessageInfo,
} from 'nodemailer';
import { SmtpOptions } from 'nodemailer-smtp-transport';
import {
  ConfigInterface,
  NotificationInterface,
  DataServiceInterface,
  EmailServiceInterface,
  WebhookInterface,
} from './interfaces';
import { logger } from './logger';

export class NotificationService implements NotificationInterface {
  private notificationConfig: ConfigInterface;
  private transporterConfig: SmtpOptions;
  public emailOpts: SendMailOptions;
  public emailNotifier: EmailServiceInterface | undefined;
  public webhookNotifier: WebhookInterface | undefined;
  public dataClient: DataServiceInterface | undefined;

  constructor(clientConfig: ConfigInterface, DataClient: DataServiceInterface) {
    this.dataClient = DataClient;
    this.notificationConfig = clientConfig;
    this.transporterConfig = {
      host: this.notificationConfig.emailConfig.host,
      port: this.notificationConfig.emailConfig.port,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    };
    if (
      this.notificationConfig.emailConfig.auth.user &&
      this.notificationConfig.emailConfig.auth.pass
    ) {
      this.transporterConfig.auth = {
        user: this.notificationConfig.emailConfig.auth.user,
        pass: this.notificationConfig.emailConfig.auth.pass,
      };
    }
    this.emailOpts = {
      from: `Argus <${this.notificationConfig.emailOptions.from}>`,
      to: this.notificationConfig.emailOptions.to,
      subject: `Container updates by Argus`,
    };

    try {
      this.emailNotifier = new EmailService(
        this.transporterConfig,
        this.emailOpts
      );
    } catch (err) {
      this.emailNotifier = undefined;
      console.log(chalk.yellow(`${err.message}`));
      logger.error(`Email broadcast error: ${err.message}`);
    }

    try {
      this.webhookNotifier = new WebhookService(
        this.notificationConfig.webhookUrls,
        this.notificationConfig.pushoverAppToken,
        this.notificationConfig.pushoverUserKey,
        this.notificationConfig.pushoverDevice,
        this.notificationConfig.telegramBotToken,
        this.notificationConfig.telegramChatId
      );
    } catch (err) {
      this.webhookNotifier = undefined;
      console.log(chalk.yellow(`${err.message}`));
      logger.error(`Webhook broadcast error: ${err.message}`);
    }
  }

  async sendNotifications(
    monitoredContainers: number | undefined,
    updatedContainers: number | undefined,
    updatedContainerObjects: [
      ImageInspectInfo,
      ImageInspectInfo,
      ContainerInspectInfo
    ][]
  ): Promise<[any, void]> {
    if (!this.emailNotifier && !this.webhookNotifier)
      return Promise.all([Promise.resolve(), Promise.resolve()]);
    if (!this.emailNotifier)
      return Promise.all([
        Promise.resolve(),
        this.webhookNotifier.sendWebhookNotifications(
          this.notificationConfig.dockerHost,
          monitoredContainers,
          updatedContainers,
          updatedContainerObjects
        ),
      ]);
    if (!this.webhookNotifier)
      return Promise.all([
        this.emailNotifier.sendEmail(
          this.notificationConfig.dockerHost,
          monitoredContainers,
          updatedContainers,
          updatedContainerObjects
        ),
        Promise.resolve(),
      ]);

    const notificationPromises: [
      Promise<SentMessageInfo | undefined>,
      Promise<void | undefined>
    ] = [
      this.emailNotifier.sendEmail(
        this.notificationConfig.dockerHost,
        monitoredContainers,
        updatedContainers,
        updatedContainerObjects
      ),
      this.webhookNotifier.sendWebhookNotifications(
        this.notificationConfig.dockerHost,
        monitoredContainers,
        updatedContainers,
        updatedContainerObjects
      ),
    ];
    return Promise.all(notificationPromises);
  }
}

export class EmailService implements EmailServiceInterface {
  private _transporter: Transporter;
  public emailOptions: SendMailOptions;

  constructor(transporterConfig: SmtpOptions, emailOptions: SendMailOptions) {
    if (!transporterConfig.host || !transporterConfig.port) {
      logger.info(`Email warn: SMTP host and port not specified`);
      throw new Error('SMTP host and port not specified. Disabling SMTP');
    }

    if (!emailOptions.from || !emailOptions.to) {
      logger.info(`Email warn: Email sender and recipents not specified`);
      throw new Error(
        'Insufficient parameters supplied, please specify email sender and recipients. Disabling SMTP'
      );
    }

    this._transporter = createTransport(transporterConfig);
    this.emailOptions = emailOptions;
  }

  async sendEmail(
    dockerHost: string | null,
    monitoredContainers: number | undefined,
    updatedContainers: number | undefined,
    updatedContainerObjects: [
      ImageInspectInfo,
      ImageInspectInfo,
      ContainerInspectInfo
    ][]
  ): Promise<SentMessageInfo | undefined> {
    let mailBody = `<h2>Container updates:</h2><br>
                            <strong>Host Socket:</strong>${dockerHost}<br>
                            <strong>Containers Monitored:</strong>${monitoredContainers}<br>
                            <strong>Containers Updated:</strong>${updatedContainers}<br>
                        `;
    if (updatedContainerObjects.length) {
      let updatedContainersBody = '';
      for (const updatedObject of updatedContainerObjects) {
        updatedContainersBody += `${updatedObject[2].Name} updated from ${updatedObject[0].Id} to ${updatedObject[1].Id}\n`;
      }
      mailBody += updatedContainersBody;
    }
    const sendEmailOptions: SendMailOptions = {
      ...this.emailOptions,
      html: mailBody,
    };
    try {
      const messageInfo = await this._transporter.sendMail(sendEmailOptions);
      return messageInfo;
    } catch (err) {
      console.log(
        chalk.red(
          `There was a problem talking to the SMTP server, disabling SMTP. Error: ${err.message}`
        )
      );
      logger.error(`SMTP server error: ${err.message}`);
      return;
    }
  }
}

export class WebhookService implements WebhookInterface {
  public webhookUrls: string[] | undefined;
  public pushoverAppToken: string | undefined;
  public pushoverUserKey: string | undefined;
  public pushoverDevice: string | undefined;
  public telegramBotToken: string | undefined;
  public telegramChatId: string | undefined;

  constructor(
    webHookUrls: string[] | undefined,
    pushoverAppToken: string | undefined,
    pushoverUserKey: string | undefined,
    pushoverDevice: string | undefined,
    telegramBotToken: string | undefined,
    telegramChatId: string | undefined
  ) {
    if (!webHookUrls || !webHookUrls.length) {
      logger.info(`Webhook warn: No valid Webhook URLs found`);
      throw new Error(
        'No valid Webhook URLs found for notification broadcast.'
      );
    }
    this.webhookUrls = webHookUrls;
    this.pushoverAppToken = pushoverAppToken;
    this.pushoverUserKey = pushoverUserKey;
    this.pushoverDevice = pushoverDevice;
    this.telegramBotToken = telegramBotToken;
    this.telegramChatId = telegramChatId;
  }

  async sendWebhookNotifications(
    dockerHost: string | null,
    monitoredContainers: number | undefined,
    updatedContainers: number | undefined,
    updatedContainerObjects: [
      ImageInspectInfo,
      ImageInspectInfo,
      ContainerInspectInfo
    ][]
  ): Promise<void | undefined> {
    const dispatchUrlPayloadPairs: [string, string][] | undefined = [];
    let webhookType = 'default';

    for (let webhookUrl of this.webhookUrls) {
      if (webhookUrl.includes('slack')) {
        webhookType = 'slack';
      } else if (webhookUrl.includes('discord')) {
        webhookType = 'discord';
      } else if (webhookUrl.includes('pushover')) {
        webhookType = 'pushover';
      } else if (webhookUrl.includes('telegram')) {
        webhookType = 'telegram';
        webhookUrl += `${this.telegramBotToken}/sendMessage`;
      }

      const webhookPayload: string = this.modelWebhookPayload(
        webhookType,
        dockerHost,
        monitoredContainers,
        updatedContainers,
        updatedContainerObjects
      );
      dispatchUrlPayloadPairs.push([webhookUrl, webhookPayload]);
    }
    await this.postToWebhooks(dispatchUrlPayloadPairs);
  }

  modelWebhookPayload(
    webhookType: string | null,
    dockerHost: string | null,
    monitoredContainers: number | undefined,
    updatedContainers: number | undefined,
    updatedContainerObjects: [
      ImageInspectInfo,
      ImageInspectInfo,
      ContainerInspectInfo
    ][]
  ): string {
    let payload;
    switch (webhookType) {
      case 'discord':
        payload = {
          username: 'Webhook Messenger',
          embeds: [
            {
              title: 'Argus has updated containers',
              description: 'Breakdown:',
              color: 15258703,
              fields: [
                {
                  name: 'Socket:',
                  value: `${dockerHost}`,
                },
                {
                  name: 'Containers Monitored:',
                  value: `${monitoredContainers}`,
                },
                {
                  name: 'Containers Updated:',
                  value: `${updatedContainers}`,
                },
              ],
            },
          ],
        };
        if (updatedContainerObjects.length) {
          for (const updatedObject of updatedContainerObjects) {
            payload.embeds[0].fields.push({
              name: updatedObject[2].Name,
              value: `Old SHA: ${updatedObject[0].Id} | New SHA ${updatedObject[1].Id}`,
            });
          }
        }
        break;

      case 'slack':
        payload = {
          text: `Socket: ${dockerHost}\nContainers Monitored: ${monitoredContainers}\nContainers Updated: ${updatedContainers}\n`,
        };
        if (updatedContainerObjects.length) {
          for (const updatedObject of updatedContainerObjects) {
            payload.text += `${updatedObject[2].Name} updated: Old SHA: ${updatedObject[0].Id} | New SHA ${updatedObject[1].Id}\n`;
          }
        }
        break;

      case 'pushover':
        payload = {
          token: this.pushoverAppToken,
          user: this.pushoverUserKey,
          device: this.pushoverDevice,
          title: 'Ouroboros has updated containers!',
          message: `Socket: ${dockerHost}\nContainers Monitored: ${monitoredContainers}\nContainers Updated: ${updatedContainers}\n`,
        };
        if (updatedContainerObjects.length) {
          for (const updatedObject of updatedContainerObjects) {
            payload.message += `${updatedObject[2].Name} updated: Old SHA: ${updatedObject[0].Id} | New SHA ${updatedObject[1].Id}\n`;
          }
        }
        break;

      case 'telegram':
        payload = {
          chat_id: this.telegramChatId,
          text: `Socket: ${dockerHost}\nContainers Monitored: ${monitoredContainers}\nContainers Updated: ${updatedContainers}\n`,
        };
        if (updatedContainerObjects.length) {
          for (const updatedObject of updatedContainerObjects) {
            payload.text += `${updatedObject[2].Name} updated: Old SHA: ${updatedObject[0].Id} | New SHA ${updatedObject[1].Id}\n`;
          }
        }
        break;

      default:
        break;
    }
    return JSON.stringify(payload);
  }

  async postToWebhooks(
    dispatchUrlPayloadPairs: [string, string][] | undefined
  ): Promise<void | undefined> {
    for (const urlPayloadPair of dispatchUrlPayloadPairs) {
      const url: string = urlPayloadPair[0];
      const payload: string = urlPayloadPair[1];
      const headers = {
        'Content-type': 'application/json',
      };
      try {
        await axios.post(url, payload, { headers });
      } catch (err) {
        console.log(chalk.red(`Error posting to Webhook ${url} -> ${err}`));
        logger.error(`Webhook ${url} error: ${err.message}`);
      }
    }
  }
}
