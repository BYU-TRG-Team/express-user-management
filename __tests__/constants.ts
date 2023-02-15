import { InitOptions } from "types/system";
import winston from "winston";

export const MOCK_AUTH_SECRET = "foobar";
export const MOCK_TOKEN = "foobar";
export const MOCK_USERNAME = "foobar";
export const MOCK_PASSWORD = "foobar";
export const MOCK_EMAIL = "foo@bar.com";
export const RANDOM_STRING = "foo";
export const MOCK_UUID = "bb4ed011-563a-4ee1-88ad-5144a9e606d0";
export const MOCK_INIT_OPTIONS: InitOptions = {
  smtpConfig: {
    transporterConfig: {},
    email: "foo@foobar.com"
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