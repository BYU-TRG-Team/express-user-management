import ConfigManager from "@config-manager";
import { Transporter } from "nodemailer";
import Mail from "nodemailer/lib/mailer";


class SmtpService {
  private smtpClient: Transporter;
  public hostAddress: string;

  constructor(smtpClient: Transporter, configManager: ConfigManager) {
    this.smtpClient = smtpClient;
    this.hostAddress = configManager.smtpClientConfig.email;
  }

  sendEmail(mailOptions: Mail.Options) {
    return new Promise((resolve, reject) => {
      this.smtpClient.sendMail(mailOptions).then((result) => resolve(result))
        .catch((error) => reject(error));
    });
  }
}

export default SmtpService;