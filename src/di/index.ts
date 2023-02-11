import nodemailer from "nodemailer";
import { InitOptions } from "../types/system";
import pg from "pg";
import Database from "../db/index";
import User from "../db/user";
import SmtpService from "../services/smtp";
import Token from "../db/token";
import AuthController from "../controllers/auth";
import UserController from "../controllers/user";
import TokenHandler from "../support/tokenhandler";


export interface DIContainer {
  AuthController: AuthController,
  UserController: UserController,
  config: {
    secret: string;
  }
  DB: Database
}

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
  };
}
