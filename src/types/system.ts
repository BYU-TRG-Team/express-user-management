import { PoolConfig } from "pg";
import { Logger } from "winston";
import { NodemailerInterface } from "types/smtp";
import { AuthConfig } from "types/auth";

export type InitOptions = {
  smtpConfig: {
    transporterConfig: NodemailerInterface,
    email: string;
  },
  authConfig: AuthConfig;
  dbConfig: PoolConfig;
  logger: Logger;
}