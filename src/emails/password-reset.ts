import Token from "@db/models/token";
import User from "@db/models/user";
import Email from "@emails/email";
import { Request } from "express";

interface PasswordResetEmailInfo {
  req: Request,
  user: User,
  token: Token,
}

class PasswordResetEmail extends Email {
  private subject_ = "Password Recovery Request";
  private user_: User;
  private req_: Request;
  private token_: Token;
  
  constructor(passwordResetEmailInfo: PasswordResetEmailInfo) {
    const {
      req,
      user,
      token
    } = passwordResetEmailInfo;
    
    super();
    this.req_ = req;
    this.user_ = user;
    this.token_ = token;
  }

  mailOptions() {
    const passwordResetLink = (
      `http://${this.req_.headers.host}/api/auth/recovery/verify/${this.token_.token}?userId=${this.user_.userId}`
    );
    return {
      subject: this.subject_,
      to: this.user_.email,
      html: `
      <p>Hello ${this.user_.name},</p>
      <p>Please visit this <a href="${passwordResetLink}">link</a> to reset your password.</p> 
      <p>If you did not request this, please ignore this email.</p>`,
    };
  }
}

export default PasswordResetEmail;