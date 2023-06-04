import Email from "@emails/email";
import SMTPConfig from "@configs/smtp";
import EmailRenderer from "email-templates";

class SMTPClient {
  private smtpConfig_: SMTPConfig;

  constructor(smtpConfig: SMTPConfig) {
    this.smtpConfig_ = smtpConfig;
  }

  async sendEmail(email: Email): Promise<void> {
    const renderedEmail = new EmailRenderer({
      message: {
        from: this.smtpConfig_.senderAddress
      },
      transport: this.smtpConfig_.transporterConfig,
    });

    await renderedEmail.send({
      template: this.smtpConfig_.emailTemplates[email.template],
      message: {
        to: email.recipient
      },
      locals: email.locals
    });
  }
}

export default SMTPClient;