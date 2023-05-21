import AuthConfig from "@configs/auth";
import { InitOptions } from "@typings/library";
import winston from "winston";

export const TEST_DB_CONNECTION_URL = "postgres://test-user:test-pw@express-user-management-pg-instance:5432/express-user-management";
export const TEST_AUTH_CONFIG = new AuthConfig({
  httpCookieSecret: "FOO",
  httpCookieName: "BAR"
});
export const TEST_INIT_OPTIONS: InitOptions = {
  smtpConfig: {
    transporterConfig: {},
    email: "foo@bar.com"
  },
  authConfig: TEST_AUTH_CONFIG,
  dbConfig: {},
  logger: winston.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      })
    ]
  })
};