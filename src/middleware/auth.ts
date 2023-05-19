import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwtDecode from "jwt-decode";
import { Role, HTTPCookieJWTPayload } from "@typings/auth";
import { AUTHORIZATION_ERROR, AUTHENTICATION_ERROR } from "@constants/errors";
import { HTTP_COOKIE_NAME } from "@constants/auth";

export const verifyToken = (authSecret: string) => (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies[HTTP_COOKIE_NAME];

  if (!token) {
    res.status(401).send({
      message: AUTHENTICATION_ERROR,
    });
    return;
  }

  jwt.verify(token, authSecret, { ignoreExpiration: true }, (err, decoded) => {
    if (err) {
      res.status(403).send({
        message: AUTHORIZATION_ERROR,
      });
      return;
    }

    const token = decoded as HTTPCookieJWTPayload | undefined;

    if (token) {
      req.userId = token.id;
      req.role = token.role;
    }
    
    next();
  });
};

export const checkVerification = (req: Request, res: Response, next: NextFunction) => {
  const token = jwtDecode(req.cookies[HTTP_COOKIE_NAME]) as undefined | HTTPCookieJWTPayload;

  if (token && token.verified) {
    next();
    return;
  }

  res.status(403).send({
    message: AUTHORIZATION_ERROR,
  });
};

export const checkRole = (roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  const token = jwtDecode(req.cookies[HTTP_COOKIE_NAME]) as HTTPCookieJWTPayload | undefined;

  if (token && roles.includes(token.role)) {
    next();
    return;
  }

  res.status(403).send({
    message: AUTHORIZATION_ERROR,
  });
};