import { InitOptions } from "@typings/system";
import winston from "winston";

export const MOCK_AUTH_SECRET = "FOOBAR";
export const MOCK_INIT_OPTIONS: InitOptions = {
  smtpConfig: {
    transporterConfig: {},
    email: "foo@bar.com"
  },
  authConfig: {
    secret: MOCK_AUTH_SECRET
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