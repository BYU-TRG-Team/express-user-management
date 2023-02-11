import { NodemailerInterface } from "../types/smtp.js";
import { AuthConfig } from "./auth.js";
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