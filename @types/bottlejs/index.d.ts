import UserController from "@controllers/user";
import AuthController from "@controllers/auth";
import Database from "@db";
import TokenHandler from "@support/token-handler";
import { Logger } from "winston";
import SMTPClient from "@smtp-client";
import AuthConfig from "@configs/auth";

declare module "bottlejs" {
  interface IContainer {
    Logger: Logger,
    SMTPClient: SMTPClient
    DBClient: Database,
    AuthConfig: AuthConfig,
    TokenHandler: TokenHandler,
    AuthController: AuthController,
    UserController: UserController,
  }
}