import { Request } from "express";
import { AuthToken, AuthTokenAttributes } from "../types/auth";
import { Token } from "../types/token";
import { User } from "../types/user";
import jwtDecode from "jwt-decode";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import CookieConfig from "../config/cookie";

class TokenHandler {
  private tokenSecret: string;

  constructor(tokenSecret: string) {
    this.tokenSecret = tokenSecret;
  }

  generateUpdatedUserAuthToken(req: Request, newAttributes: AuthTokenAttributes): AuthToken {
    const oldToken = jwtDecode(req.cookies[CookieConfig.cookieName]) as AuthToken;

    const newToken = jwt.sign({
      ...oldToken,
      ...newAttributes,
    }, this.tokenSecret) as unknown as AuthToken;

    return newToken;
  }

  isPasswordTokenExpired(token: Token): boolean {
    const currentDate = new Date();
    return token.created_at.getTime() < (currentDate.getTime() - 1800000); // Password reset token is considered expired after 30 minutes
  }

  generateShortToken() {
    return crypto.randomBytes(20).toString("hex");
  }

  generateUserAuthToken(user: User, req: Request): AuthToken {
    const {
      verified, user_id, username, role_id,
    } = user;

    const token = jwt.sign({
      id: user_id, role: role_id, verified, username
    }, this.tokenSecret) as unknown as AuthToken;

    return token;
  }
}

export default TokenHandler;