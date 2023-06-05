import { InitOptions } from "@typings/library";
import DBClientPool from "src/db-client-pool";
import SignUpController from "@controllers/auth/sign-up";
import AuthController from "@controllers/auth";
import UserController from "@controllers/user";
import Bottle from "bottlejs";
import SMTPClient from "@smtp-client";

export default function constructBottle(initOptions: InitOptions): Bottle {
  const {
    smtpConfig,
    logger,
    dbClientPool,
    authConfig
  } = initOptions;
  const bottle = new Bottle();
  
  bottle.factory("Logger", () => logger);
  bottle.factory("AuthConfig", () => authConfig);
  bottle.factory("DBClientPool", () => dbClientPool);
  bottle.factory("SMTPClient", () => new SMTPClient(smtpConfig));
  bottle.service(
    "SignUpController", 
    SignUpController,
    "SMTPClient", 
    "DBClientPool", 
    "Logger",
  );
  bottle.service(
    "AuthController", 
    AuthController, 
    "SMTPClient", 
    "DBClientPool", 
    "Logger",
    "AuthConfig",
  )
  ;
  bottle.service(
    "UserController", 
    UserController, 
    "Logger", 
    "DBClientPool",
    "AuthConfig",
  );

  return bottle;
}
