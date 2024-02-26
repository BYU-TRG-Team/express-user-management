import { Express } from "express";
import { InitOptions } from "./types/system";
declare const init: (app: Express, initOptions: InitOptions) => {
    userService: import("./db/user").default;
};
export default init;
export * from "./middleware/auth.js";
export * from "./types/auth.js";
export * from "./types/user.js";
