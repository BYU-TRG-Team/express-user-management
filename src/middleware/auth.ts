import { Request, Response, NextFunction } from "express";
import { Role, AuthToken } from "../types/auth";
import jwt from "jsonwebtoken";
import jwtDecode from "jwt-decode";
import errorMessages from "../messages/errors";
import CookieConfig from "../config/cookie";

export const verifyToken = (authSecret: string) => (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies[CookieConfig.cookieName];

  if (!token) {
    res.status(401).send({
      message: errorMessages.requestUnauthorized,
    });
    return;
  }

  jwt.verify(token, authSecret, { ignoreExpiration: true }, (err, decoded) => {
    if (err) {
      res.status(403).send({
        message: errorMessages.accessForbidden,
      });
      return;
    }

    const token = decoded as AuthToken | undefined;

    if (token) {
      req.userId = token.id;
      req.role = token.role;
    }
    
    next();
  });
};

export const checkVerification = (req: Request, res: Response, next: NextFunction) => {
  const token = jwtDecode(req.cookies[CookieConfig.cookieName]) as undefined | AuthToken;

  if (token && token.verified) {
    next();
    return;
  }

  res.status(403).send({
    message: errorMessages.accessForbidden,
  });
};

export const checkRole = (roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  const token = jwtDecode(req.cookies[CookieConfig.cookieName]) as AuthToken | undefined;

  if (token && roles.includes(token.role)) {
    next();
    return;
  }

  res.status(403).send({
    message: errorMessages.accessForbidden,
  });
};