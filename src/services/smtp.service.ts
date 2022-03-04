import { Transporter } from "nodemailer";
import Mail from "nodemailer/lib/mailer";


class SmtpService {
  private transporter: Transporter;
  public hostAddress: string;

  constructor(transporter: Transporter, hostAddress: string) {
    this.transporter = transporter;
    this.hostAddress = hostAddress;
  }

  sendEmail(mailOptions: Mail.Options) {
    return new Promise((resolve, reject) => {
      this.transporter.sendMail(mailOptions).then((result) => resolve(result))
        .catch((error) => reject(error));
    });
  }
}

export default SmtpService;