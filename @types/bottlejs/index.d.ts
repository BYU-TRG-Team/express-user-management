import UserController from "@controllers/user";
import AuthController from "@controllers/auth";
import Database from "@db";
import TokenHandler from "@support/token-handler";
import { Logger } from "winston";
import SMTPClient from "@smtp-client";
import ConfigManager from "@config-manager";

declare module "bottlejs" {
  interface IContainer {
    Logger: Logger,
    ConfigManager: ConfigManager,
    SMTPClient: SMTPClient
    DBClient: Database,
    TokenHandler: TokenHandler,
    AuthController: AuthController,
    UserController: UserController,
  }
}