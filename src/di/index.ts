import nodemailer from "nodemailer";
import { InitOptions } from "../types/system.js";
import pg from "pg";
import Database from "../db/index.js";
import User from "../db/user.js";
import SmtpService from "../services/smtp.service.js";
import Token from "../db/token.js";
import AuthController from "../controllers/auth.controller.js";
import UserController from "../controllers/user.controller.js";
import TokenHandler from "../support/tokenhandler.support.js";


export interface DIContainer {
  AuthController: AuthController,
  UserController: UserController,
  config: {
    secret: string;
  }
  DB: Database
};

export default function dependencyInjection({ smtpConfig, logger, dbConfig, authConfig }: InitOptions): DIContainer {

  // SMTP Transporter
  const smtpTransporter = nodemailer.createTransport(smtpConfig.transporterConfig);

  // Support
  const tokenHandler = new TokenHandler(authConfig.secret);

  // DB
  const connectionPool = new pg.Pool(dbConfig);
  const user =  new User(connectionPool);
  const token = new Token(connectionPool);
  const db = new Database(connectionPool, {
    User: user,
    Token: token,
  });

  // Services
  const smtpService = new SmtpService(smtpTransporter, smtpConfig.email);

  // Controllers
  const authController = new AuthController(smtpService, tokenHandler, db, logger);
  const userController = new UserController(tokenHandler, logger, db);

  return {
    AuthController: authController,
    UserController: userController,
    config: {
      secret: authConfig.secret
    },
    DB: db,
  }
}
