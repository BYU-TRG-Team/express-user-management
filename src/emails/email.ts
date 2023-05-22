import { SendMailOptions } from "nodemailer";

abstract class Email {
  abstract mailOptions(): SendMailOptions
}

export default Email;