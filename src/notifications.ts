import chalk from 'chalk';
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
} from './interfaces';

export class NotificationService implements NotificationInterface {
  private notificationConfig: ConfigInterface;
  private transporterConfig: SmtpOptions;
  public emailOpts: SendMailOptions;
  public emailNotifier: EmailServiceInterface;

  constructor(clientConfig: ConfigInterface) {
    this.notificationConfig = clientConfig;
    if (
      !this.notificationConfig.emailConfig.host ||
      !this.notificationConfig.emailConfig.port
    ) {
      throw new Error(
        'Insufficient parameters supplied, please specify SMTP host and port. Disabling SMTP'
      );
    }
    if (
      !this.notificationConfig.emailOptions.from ||
      !this.notificationConfig.emailOptions.to
    ) {
      throw new Error(
        'Insufficient parameters supplied, please specify email sender and recipients. Disabling SMTP'
      );
    }
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
    this.emailNotifier = new EmailService(
      this.transporterConfig,
      this.emailOpts
    );
  }

  async sendNotifications(
    monitoredContainers: number | undefined,
    updatedContainers: number | undefined,
    updatedContainerObjects: [
      ImageInspectInfo,
      ImageInspectInfo,
      ContainerInspectInfo
    ][]
  ): Promise<void> {
    const emailInfo: SentMessageInfo = await this.emailNotifier.sendEmail(
      this.notificationConfig.dockerHost,
      monitoredContainers,
      updatedContainers,
      updatedContainerObjects
    );
    console.log(emailInfo);
    return;
  }
}

export class EmailService implements EmailServiceInterface {
  private _transporter: Transporter;
  public emailOptions: SendMailOptions;

  constructor(transporterConfig: SmtpOptions, emailOptions: SendMailOptions) {
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
    let mailBody = `<h2>Container updates:</h2>
                            <strong>Host Socket:</strong>${dockerHost}
                            <strong>Containers Monitored:</strong>${monitoredContainers}
                            <strong>Containers Updated:</strong>${updatedContainers}
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
