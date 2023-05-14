import ConfigManager from "@config-manager";
import nodemailer from "nodemailer";

class SMTPClient {
  private transporter: nodemailer.Transporter;
  private senderAddress: string;

  constructor(configManager: ConfigManager) {
    this.transporter = nodemailer.createTransport(
      configManager.smtpClient.transporterConfig
    );
    this.senderAddress = configManager.smtpClient.email;
  }

  async sendEmail(options: nodemailer.SendMailOptions): Promise<void> {
    return await this.transporter.sendMail({
      ...options,
      from: this.senderAddress,
    });
  }
}

export default SMTPClient;