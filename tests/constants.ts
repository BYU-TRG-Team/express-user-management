import { InitOptions } from "@typings/library";
import winston from "winston";

export const TEST_DB_CONNECTION_URL="postgres://test-user:test-pw@express-user-management-pg-instance:5432/express-user-management";
export const TEST_AUTH_SECRET = "FOOBAR";
export const TEST_INIT_OPTIONS: InitOptions = {
  smtpConfig: {
    transporterConfig: {},
    email: "foo@bar.com"
  },
  authConfig: {
    httpCookieSecret: TEST_AUTH_SECRET
  },
  dbConfig: {},
  logger: winston.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      })
    ]
  })
};