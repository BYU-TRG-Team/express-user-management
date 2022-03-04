import { Express } from "express";
import * as authMiddleware from "../middleware/auth.middleware.js";
import { Role } from "../types/auth.js";
import { DIContainer } from "di/index.js";

const constructUserRoutes = (app: Express, di: DIContainer) => {
  app.get(
    '/api/user/:id',
    authMiddleware.verifyToken(di.config.secret),
    authMiddleware.checkVerification,
    di.UserController.getUser.bind(di.UserController),
  );

  app.get(
    '/api/users',
    authMiddleware.verifyToken(di.config.secret),
    authMiddleware.checkVerification,
    authMiddleware.checkRole([Role.Admin]),
    di.UserController.getUsers.bind(di.UserController),
  );

  app.patch(
    '/api/user/:id',
    authMiddleware.verifyToken(di.config.secret),
    authMiddleware.checkVerification,
    di.UserController.updateUser.bind(di.UserController),
  );

  app.delete(
    '/api/user/:id',
    authMiddleware.verifyToken(di.config.secret),
    authMiddleware.checkVerification,
    authMiddleware.checkRole([Role.Admin]),
    di.UserController.deleteUser.bind(di.UserController),
  );
};

export default constructUserRoutes;