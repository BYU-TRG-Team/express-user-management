import AuthConfig from "@configs/auth";
import SMTPConfig from "@configs/smtp";
import DBClientPool from "@db-client-pool";
import { InitOptions } from "@typings/library";
import pg from "pg";
import winston from "winston";

export const TEST_PG_POOL = new pg.Pool({
  connectionString: "postgres://test-user:test-pw@express-user-management-pg-instance:5432/express-user-management",
  ssl: false,
  allowExitOnIdle: true
});
export const TEST_DB_CLIENT_POOL = new DBClientPool(TEST_PG_POOL);
export const TEST_AUTH_CONFIG = new AuthConfig({
  httpCookieSecret: "FOO",
  httpCookieName: "BAR"
});
export const TEST_SMTP_CONFIG = new SMTPConfig({
  transportConfig: {},
  senderAddress: "foo@bar.com"
});
export const TEST_LOGGER = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  ]
});
export const TEST_INIT_OPTIONS: InitOptions = {
  smtpConfig: TEST_SMTP_CONFIG,
  authConfig: TEST_AUTH_CONFIG,
  dbClientPool: TEST_DB_CLIENT_POOL,
  logger: TEST_LOGGER
};