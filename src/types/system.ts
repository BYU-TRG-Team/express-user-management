import { PoolConfig } from "pg";
import { Logger } from "winston";
import { NodemailerInterface } from "@typings/smtp";
import { AuthConfig } from "@typings/auth";

export type InitOptions = {
  smtpConfig: {
    transporterConfig: NodemailerInterface,
    email: string;
  },
  authConfig: AuthConfig;
  dbConfig: PoolConfig;
  logger: Logger;
}