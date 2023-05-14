import UserController from "@controllers/user";
import AuthController from "@controllers/auth";
import Database from "@db";
import TokenHandler from "@support/token-handler";
import { Logger } from "winston";
import { Transport } from "nodemailer"
import SmtpService from "@services/smtp";
import ConfigManager from "@config-manager";

declare module "bottlejs" {
  interface IContainer {
    Logger: Logger,
    ConfigManager: ConfigManager,
    SMTPClient: Transport
    DBClient: Database,
    TokenHandler: TokenHandler,
    SMTPService: SmtpService,
    AuthController: AuthController,
    UserController: UserController,
  }
}