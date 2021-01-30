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
  EmailServiceInterface,
  WebhookInterface,
} from './interfaces';

export class NotificationService implements NotificationInterface {
  private notificationConfig: ConfigInterface;
  private transporterConfig: SmtpOptions;
  public emailOpts: SendMailOptions;
  public emailNotifier: EmailServiceInterface | undefined;
  public webhookNotifier: WebhookInterface | undefined;

  constructor(clientConfig: ConfigInterface) {
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
    }

    try {
      this.webhookNotifier = new WebhookService(
        this.notificationConfig.webhookUrls
      );
    } catch (err) {
      this.webhookNotifier = undefined;
      console.log(chalk.yellow(`${err.message}`));
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
      throw new Error('SMTP host and not port not specified. Disabling SMTP');
    }

    if (!emailOptions.from || !emailOptions.to) {
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
      return;
    }
  }
}

export class WebhookService implements WebhookInterface {
  public webhookUrls: string[] | undefined;

  constructor(webHookUrls: string[] | undefined) {
    if (!webHookUrls || !webHookUrls.length) {
      throw new Error(
        'No valid Webhook URLs found for notification broadcast.'
      );
    }
    this.webhookUrls = webHookUrls;
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

    for (const webhookUrl of this.webhookUrls) {
      if (webhookUrl.includes('slack')) {
        webhookType = 'slack';
      } else if (webhookUrl.includes('discord')) {
        webhookType = 'discord';
      } else if (webhookUrl.includes('pushover')) {
        webhookType = 'pushover';
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
    const timestamp: string = JSON.stringify(new Date());
    let payload;
    switch (webhookType) {
      case 'discord':
        payload = {
          username: 'Webhook Messenger',
          embeds: [
            {
              title: 'Argus has updates for you!',
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
      }
    }
  }
}
