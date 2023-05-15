import { SMTPClientConfig } from "@typings/smtp";
import nodemailer from "nodemailer";

class SMTPClient {
  private transporter_: nodemailer.Transporter;
  private senderAddress_: string;

  constructor(smtpClientConfig: SMTPClientConfig) {
    this.transporter_ = nodemailer.createTransport(
      smtpClientConfig.transporterConfig
    );
    this.senderAddress_ = smtpClientConfig.email;
  }

  async sendEmail(options: nodemailer.SendMailOptions): Promise<void> {
    return await this.transporter_.sendMail({
      ...options,
      from: this.senderAddress_,
    });
  }
}

export default SMTPClient;