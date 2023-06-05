import { Logger } from "winston";
import AuthConfig from "@configs/auth";
import SMTPConfig from "@configs/smtp";
import DBClientPool from "@db-client-pool";

export type InitOptions = {
  smtpConfig: SMTPConfig;
  authConfig: AuthConfig;
  dbClientPool: DBClientPool
  logger: Logger;
}