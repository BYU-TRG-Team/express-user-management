import Token from "@db/models/token";
import User from "@db/models/user";
import Email from "@emails/email";
import { Request } from "express";

interface VerificationEmailInfo {
  req: Request,
  user: User,
  token: Token,
}

class VerificationEmail extends Email {
  private subject_ = "Account Verification Request";
  private user_: User;
  private req_: Request;
  private token_: Token;
  
  constructor(verificationEmailInfo: VerificationEmailInfo) {
    const {
      req,
      user,
      token
    } = verificationEmailInfo;

    super();
    this.req_ = req;
    this.user_ = user;
    this.token_ = token;
  }

  mailOptions() {
    const verificationLink = (
      `http://${this.req_.headers.host}/api/auth/verify/${this.token_.token}?userId=${this.user_.userId}`
    );
    return {
      subject: this.subject_,
      to: this.user_.email,
      html: `
      <p>Hello ${this.user_.name},</p>
      <p>Please visit this <a href="${verificationLink}">link</a> to verify your account.</p> 
      <p>If you did not request this, please ignore this email.</p>`,
    };
  }
}

export default VerificationEmail;