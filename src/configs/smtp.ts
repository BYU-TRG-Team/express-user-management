import { DEFAULT_PASSWORD_RESET_EMAIL_TEMPLATE, DEFAULT_VERIFICATION_EMAIL_TEMPALTE } from "@constants/smtp";
import { EmailTemplate } from "@typings/smtp";
import { Transport, TransportOptions } from "nodemailer";

export type EmailTemplateMap = {[key in EmailTemplate]: string} 

interface SMTPInfo {
  transporterConfig: TransportOptions | Transport;
  senderAddress: string;
  passwordResetEmailTemplate?: string,
  verificationEmailTemplate?: string,
}

class SMTPConfig {
  private transporterConfig_: TransportOptions | Transport;
  private senderAddress_: string;
  private emailTemplates_: EmailTemplateMap;

  constructor(smtpInfo: SMTPInfo) {
    const {
      transporterConfig,
      senderAddress,
      passwordResetEmailTemplate = DEFAULT_PASSWORD_RESET_EMAIL_TEMPLATE,
      verificationEmailTemplate = DEFAULT_VERIFICATION_EMAIL_TEMPALTE
    } = smtpInfo;

    this.transporterConfig_ = transporterConfig;
    this.senderAddress_ = senderAddress;
    this.emailTemplates_ = {
      [EmailTemplate.Password]: passwordResetEmailTemplate,
      [EmailTemplate.Verification]: verificationEmailTemplate
    };
  }

  get transporterConfig() {
    return this.transporterConfig_;
  }

  get senderAddress() {
    return this.senderAddress_;
  }

  get emailTemplates() {
    return this.emailTemplates_;
  }
}

export default SMTPConfig;