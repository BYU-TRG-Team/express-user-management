import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role, HTTPCookieJWTPayload } from "@typings/auth";
import { AUTHORIZATION_ERROR, AUTHENTICATION_ERROR } from "@constants/errors";
import AuthConfig from "@configs/auth";

/**
 * Verifies the JWT and exposes attributes of the payload to the request object. 
 * 
 * The attributes exposed to the request object from the payload are used in other auth middleware and controllers. 
 * 
 * NOTE: This middleware must be invoked before any other auth middleware.
 *
 */
export const verifyHTTPCookie = (authConfig: AuthConfig) => (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const token = req.cookies[authConfig.httpCookieName];

  try {
    const payload = jwt.verify( 
      token, 
      authConfig.httpCookieSecret, 
      { ignoreExpiration: true }
    ) as HTTPCookieJWTPayload;

    req.userId = payload.id;
    req.role = payload.role;
    req.verified = payload.verified;

    next();
  } catch {
    return res.status(401).send({
      message: AUTHENTICATION_ERROR,
    });
  }
};

/**
 * Checks that a user's account is verified.
 * 
 * NOTE: This middleware must be invoked after the verifyHTTPCookie middleware.
 *
 */
export const checkUserVerification = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!req.verified) {
    return res.status(403).send({
      message: AUTHORIZATION_ERROR,
    });
  }

  next();
};

/**
 * Checks that a user is authorized. 
 * 
 * NOTE: This middleware must be invoked after the verifyHTTPCookie middleware.
 *
 */
export const checkUserRole = (allowedRoles: Role[]) => (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!allowedRoles.includes(req.role)) {
    return res.status(403).send({
      message: AUTHORIZATION_ERROR,
    });
  }

  next();
};