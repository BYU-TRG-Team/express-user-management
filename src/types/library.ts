import { PoolConfig } from "pg";
import { Logger } from "winston";
import AuthConfig from "@configs/auth";
import SMTPConfig from "@configs/smtp";

export type InitOptions = {
  smtpConfig: SMTPConfig;
  authConfig: AuthConfig;
  dbConfig: PoolConfig;
  logger: Logger;
}