import { SMTPClientConfig } from "@typings/smtp";
import nodemailer from "nodemailer";

class SMTPClient {
  private transporter: nodemailer.Transporter;
  private senderAddress: string;

  constructor(smtpClientConfig: SMTPClientConfig) {
    this.transporter = nodemailer.createTransport(
      smtpClientConfig.transporterConfig
    );
    this.senderAddress = smtpClientConfig.email;
  }

  async sendEmail(options: nodemailer.SendMailOptions): Promise<void> {
    return await this.transporter.sendMail({
      ...options,
      from: this.senderAddress,
    });
  }
}

export default SMTPClient;