import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwtDecode from "jwt-decode";
import { Role, AuthToken } from "@typings/auth";
import * as errorMessages from "@constants/errors/messages";
import * as cookieConfig from "@constants/http/cookie";

export const verifyToken = (authSecret: string) => (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies[cookieConfig.NAME];

  if (!token) {
    res.status(401).send({
      message: errorMessages.REQUEST_UNAUTHORIZED,
    });
    return;
  }

  jwt.verify(token, authSecret, { ignoreExpiration: true }, (err, decoded) => {
    if (err) {
      res.status(403).send({
        message: errorMessages.ACCESS_FORBIDDEN,
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
  const token = jwtDecode(req.cookies[cookieConfig.NAME]) as undefined | AuthToken;

  if (token && token.verified) {
    next();
    return;
  }

  res.status(403).send({
    message: errorMessages.ACCESS_FORBIDDEN,
  });
};

export const checkRole = (roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
  const token = jwtDecode(req.cookies[cookieConfig.NAME]) as AuthToken | undefined;

  if (token && roles.includes(token.role)) {
    next();
    return;
  }

  res.status(403).send({
    message: errorMessages.ACCESS_FORBIDDEN,
  });
};