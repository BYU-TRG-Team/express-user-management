import UserController from "@controllers/user";
import AuthController from "@controllers/auth";
import DBClient from "@db-client";
import { Logger } from "winston";
import SMTPClient from "@smtp-client";
import AuthConfig from "@configs/auth";

declare module "bottlejs" {
  interface IContainer {
    Logger: Logger,
    SMTPClient: SMTPClient
    DBClient: DBClient,
    AuthConfig: AuthConfig,
    AuthController: AuthController,
    UserController: UserController,
  }
}