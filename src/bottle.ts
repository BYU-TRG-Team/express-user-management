import { InitOptions } from "@typings/library";
import Database from "@db";
import AuthController from "@controllers/auth";
import UserController from "@controllers/user";
import Bottle from "bottlejs";
import SMTPClient from "@smtp-client";

export default function constructBottle(initOptions: InitOptions): Bottle {
  const {
    smtpConfig,
    logger,
    dbConfig,
    authConfig
  } = initOptions;
  const bottle = new Bottle();
  
  bottle.factory("Logger", () => logger);
  bottle.factory("AuthConfig", () => authConfig);
  bottle.factory("SMTPClient", () => new SMTPClient(smtpConfig));
  bottle.factory("DBClient", () => new Database(dbConfig));
  bottle.service(
    "AuthController", 
    AuthController, 
    "SMTPClient", 
    "DBClient", 
    "Logger",
    "AuthConfig",
  )
  ;
  bottle.service(
    "UserController", 
    UserController, 
    "Logger", 
    "DBClient",
    "AuthConfig",
  );

  return bottle;
}
