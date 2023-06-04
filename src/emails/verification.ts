import Token from "@db/models/token";
import User from "@db/models/user";
import Email from "@emails/email";
import { EmailTemplate, EmailTemplateLocals } from "@typings/smtp";
import { Request } from "express";

interface VerificationEmailInfo {
  req: Request,
  user: User,
  token: Token,
}

class VerificationEmail extends Email {
  private template_ = EmailTemplate.Verification;
  private recipient_: string;
  private locals_: EmailTemplateLocals;

  constructor(verificationEmailInfo: VerificationEmailInfo) {
    const {
      req,
      user,
      token
    } = verificationEmailInfo;
    
    super();
    this.recipient_ = user.email;
    this.locals_ = {
      name: user.name,
      link: `http://${req.headers.host}/api/auth/verify/${token.token}?userId=${user.userId}`
    };
  }

  get template() {
    return this.template_;
  }

  get recipient() {
    return this.recipient_;
  }

  get locals() {
    return this.locals_;
  }
}

export default VerificationEmail;