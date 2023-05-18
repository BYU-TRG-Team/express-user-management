import express, { Express } from "express";
import cookieParser from "cookie-parser";
import constructBottle from "@bottle";
import constructAuthRoutes from "@routes/auth";
import constructUserRoutes from "@routes/user";
import { InitOptions } from "@typings/system";

const init = (app: Express, initOptions: InitOptions) => {
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({
    extended: true,
  }));

  const bottle = constructBottle(initOptions);
  
  constructAuthRoutes(app, bottle);
  constructUserRoutes(app, bottle);
};

export default init;
export * from "@middleware/auth";
export * from "@typings/auth";
