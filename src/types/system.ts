import { NodemailerInterface } from "../types/smtp";
import { AuthConfig } from "./auth";
import { PoolConfig } from "pg";
import { Logger } from "winston";

export type InitOptions = {
  smtpConfig: {
    transporterConfig: NodemailerInterface,
    email: string;
  },
  authConfig: AuthConfig;
  dbConfig: PoolConfig;
  logger: Logger;
}