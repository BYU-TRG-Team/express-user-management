import { CookieOptions } from "express";
import { HTTP_COOKIE_OPTIONS, HTTP_COOKIE_LIFETIME } from "@constants/auth";
import crypto from "crypto";
import User from "@db/models/user";
import AuthConfig from "@configs/auth";
import jwt from "jsonwebtoken";
import { HTTPCookieJWTPayload } from "@typings/auth";
import bcrypt from "bcrypt";

/**
 * Constructs an HTTP cookie configuration utilizing HTTP_COOKIE_OPTIONS and HTTP_COOKIE_LIFETIME
 */
export const constructHTTPCookieConfig = (): CookieOptions => {
  return {
    ...HTTP_COOKIE_OPTIONS,
    expires: new Date(
      Date.now() + HTTP_COOKIE_LIFETIME
    ),
  };
};

/**
 * Generates a 16-byte cryptographically strong pseudorandom token
 */
export const generateOneTimeToken = () => {
  return crypto.randomBytes(16).toString("hex");
};

/**
 * Creates a JWT with a payload following the form of HTTPCookieJWTPayload
 */
export const createHTTPCookie = (
  user: User,
  authConfig: AuthConfig
) => {
  const payload: HTTPCookieJWTPayload = {
    id: user.userId, 
    role: user.roleId, 
    verified: user.verified,
    username: user.username
  };
  const token = jwt.sign(payload, authConfig.httpCookieSecret);

  return token;
};

/**
 * Hashes a password using bcrypt with a cost factor of 10
 */
export const hashPassword = async (password: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return hashedPassword;
};