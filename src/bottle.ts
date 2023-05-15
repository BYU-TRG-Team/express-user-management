import { InitOptions } from "@typings/system";
import Database from "@db";
import AuthController from "@controllers/auth";
import UserController from "@controllers/user";
import TokenHandler from "@support/token-handler";
import Bottle from "bottlejs";
import SMTPClient from "@smtp-client";
import AuthConfig from "@configs/auth";

export default function constructBottle(initOptions: InitOptions): Bottle {
  const {
    smtpConfig,
    logger,
    dbConfig,
    authConfig
  } = initOptions;
  const bottle = new Bottle();
  
  bottle.factory("Logger", () => logger);
  bottle.factory("SMTPClient", () => new SMTPClient(smtpConfig));
  bottle.factory("DBClient", () => new Database(dbConfig));
  bottle.factory("AuthConfig", () => new AuthConfig(authConfig.secret));
  bottle.service("TokenHandler", TokenHandler, "AuthConfig");
  bottle.service(
    "AuthController", 
    AuthController, 
    "SMTPClient", 
    "TokenHandler", 
    "DBClient", 
    "Logger")
  ;
  bottle.service(
    "UserController", 
    UserController, 
    "TokenHandler", 
    "Logger", 
    "DBClient"
  );

  return bottle;
}
