import express, { Express } from "express";
import cookieParser from "cookie-parser";
import dependencyInjection from "@di/index";
import constructAuthRoutes from "@routes/auth";
import constructUserRoutes from "@routes/user";
import { InitOptions } from "@typings/system";

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
  };
};

export default init;
export * from "@middleware/auth";
export * from "@typings/auth";
export * from "@typings/user";

