import { Express } from "express";
import * as authMiddleware from "@middleware/auth";
import { Role } from "@typings/auth";
import Bottle from "bottlejs";

const constructUserRoutes = (app: Express, bottle: Bottle) => {
  app.get(
    "/api/user/:id",
    authMiddleware.verifyHTTPCookie(bottle.container.AuthConfig),
    authMiddleware.checkUserVerification,
    bottle.container.UserController.getUser.bind(bottle.container.UserController),
  );

  app.get(
    "/api/users",
    authMiddleware.verifyHTTPCookie(bottle.container.AuthConfig),
    authMiddleware.checkUserVerification,
    authMiddleware.checkUserRole([Role.Admin]),
    bottle.container.UserController.getUsers.bind(bottle.container.UserController),
  );

  app.patch(
    "/api/user/:id",
    authMiddleware.verifyHTTPCookie(bottle.container.AuthConfig),
    authMiddleware.checkUserVerification,
    bottle.container.UserController.updateUser.bind(bottle.container.UserController),
  );

  app.delete(
    "/api/user/:id",
    authMiddleware.verifyHTTPCookie(bottle.container.AuthConfig),
    authMiddleware.checkUserVerification,
    authMiddleware.checkUserRole([Role.Admin]),
    bottle.container.UserController.deleteUser.bind(bottle.container.UserController),
  );
};

export default constructUserRoutes;