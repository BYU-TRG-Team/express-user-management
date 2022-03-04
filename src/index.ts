import express, { Express } from "express";
import cookieParser from "cookie-parser";
import dependencyInjection from "./di/index.js";
import constructAuthRoutes from "./routes/auth.routes.js";
import constructUserRoutes from "./routes/user.routes.js";
import { InitOptions } from "./types/system.js";

const init = (app: Express, initOptions: InitOptions) => {
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({
    extended: true,
  }));

  const di = dependencyInjection(initOptions);
  
  constructAuthRoutes(app, di);
  constructUserRoutes(app, di);

  return {
    userService: di.DB.objects.User,
  }
}

export default init
export * from "./middleware/auth.middleware.js";
export * from "./types/auth.js";
export * from "./types/user.js";

