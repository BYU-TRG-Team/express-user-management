import { Request } from "express";
import { Token } from "@typings/token";
import User from "@db/models/user";
import jwtDecode from "jwt-decode";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import AuthConfig from "@configs/auth";
import { AuthToken, AuthTokenAttributes } from "@typings/auth";
import { HTTP_COOKIE_NAME } from "@constants/auth";

class TokenHandler {
  private authConfig_: AuthConfig;

  constructor(authConfig: AuthConfig) {
    this.authConfig_ = authConfig;
  }

  generateUpdatedUserAuthToken(req: Request, newAttributes: AuthTokenAttributes): AuthToken {
    const oldToken = jwtDecode(req.cookies[HTTP_COOKIE_NAME]) as AuthToken;

    const newToken = jwt.sign({
      ...oldToken,
      ...newAttributes,
    }, this.authConfig_.jwtSecret) as unknown as AuthToken;

    return newToken;
  }

  isPasswordTokenExpired(token: Token): boolean {
    const currentDate = new Date();
    return token.created_at.getTime() < (currentDate.getTime() - 1800000); // Password reset token is considered expired after 30 minutes
  }

  generateShortToken() {
    return crypto.randomBytes(20).toString("hex");
  }

  generateUserAuthToken(user: User): AuthToken {
    const {
      verified, userId, username, roleId,
    } = user;

    const token = jwt.sign({
      id: userId, role: roleId, verified, username
    }, this.authConfig_.jwtSecret) as unknown as AuthToken;

    return token;
  }
}

export default TokenHandler;