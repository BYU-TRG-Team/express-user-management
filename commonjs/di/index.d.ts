import { InitOptions } from "../types/system";
import Database from "../db/index";
import AuthController from "../controllers/auth";
import UserController from "../controllers/user";
export interface DIContainer {
    AuthController: AuthController;
    UserController: UserController;
    config: {
        secret: string;
    };
    DB: Database;
}
export default function dependencyInjection({ smtpConfig, logger, dbConfig, authConfig }: InitOptions): DIContainer;
