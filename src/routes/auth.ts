import Bottle from "bottlejs";
import { Express } from "express";

const constructAuthRoutes = (app: Express, bottle: Bottle) => {
  app.post("/api/auth/sign-up", bottle.container.SignUpController.handle.bind(bottle.container.SignUpController));

  app.post("/api/auth/signin", bottle.container.AuthController.signin.bind(bottle.container.AuthController));

  app.get("/api/auth/logout", bottle.container.AuthController.logout.bind(bottle.container.AuthController));

  app.get("/api/auth/verify/:token", bottle.container.AuthController.verify.bind(bottle.container.AuthController));

  app.post("/api/auth/recovery", bottle.container.AuthController.recovery.bind(bottle.container.AuthController));

  app.get("/api/auth/recovery/verify/:token", bottle.container.AuthController.verifyRecovery.bind(bottle.container.AuthController));

  app.post("/api/auth/recovery/:token", bottle.container.AuthController.processRecovery.bind(bottle.container.AuthController));
};

export default constructAuthRoutes;
