import { Transporter } from "nodemailer";
import Mail from "nodemailer/lib/mailer";
declare class SmtpService {
    private transporter;
    hostAddress: string;
    constructor(transporter: Transporter, hostAddress: string);
    sendEmail(mailOptions: Mail.Options): Promise<unknown>;
}
export default SmtpService;
