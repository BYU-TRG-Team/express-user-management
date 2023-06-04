import Token from "@db/models/token";
import User from "@db/models/user";
import Email from "@emails/email";
import { EmailTemplate, EmailTemplateLocals } from "@typings/smtp";
import { Request } from "express";

interface PasswordResetEmailInfo {
  req: Request,
  user: User,
  token: Token,
}

class PasswordResetEmail extends Email {
  private template_ = EmailTemplate.Password;
  private recipient_: string;
  private locals_: EmailTemplateLocals;
  
  constructor(passwordResetEmailInfo: PasswordResetEmailInfo) {
    const {
      req,
      user,
      token
    } = passwordResetEmailInfo;
    
    super();
    this.recipient_ = user.email;
    this.locals_ = {
      name: user.name,
      link: `http://${req.headers.host}/api/auth/recovery/verify/${token.token}?userId=${user.userId}`
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

export default PasswordResetEmail;