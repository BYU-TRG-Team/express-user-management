import UserController from "@controllers/user";
import AuthController from "@controllers/auth";
import { Logger } from "winston";
import SMTPClient from "@smtp-client";
import AuthConfig from "@configs/auth";
import SignUpController from "@controllers/auth/sign-up";
import DBClientPool from "@db-client-pool";

declare module "bottlejs" {
  interface IContainer {
    Logger: Logger,
    SMTPClient: SMTPClient
    DBClientPool: DBClientPool,
    AuthConfig: AuthConfig,
    SignUpController: SignUpController,
    AuthController: AuthController,
    UserController: UserController,
  }
}