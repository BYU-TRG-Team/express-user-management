import Email from "@emails/email";
import SMTPConfig from "@configs/smtp";
import nodemailer from "nodemailer";

class SMTPClient {
  private transporter_: nodemailer.Transporter;
  private senderAddress_: string;

  constructor(smtpConfig: SMTPConfig) {
    const {
      transporterConfig,
      senderAddress
    } = smtpConfig;

    this.transporter_ = nodemailer.createTransport(transporterConfig);
    this.senderAddress_ = senderAddress;
  }

  async sendEmail(email: Email): Promise<void> {
    return await this.transporter_.sendMail({
      ...email.mailOptions,
      from: this.senderAddress_,
    });
  }
}

export default SMTPClient;