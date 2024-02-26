import * as authMiddleware from "../middleware/auth";
import { Role } from "../types/auth";
const constructUserRoutes = (app, di) => {
    app.get("/api/user/:id", authMiddleware.verifyToken(di.config.secret), authMiddleware.checkVerification, di.UserController.getUser.bind(di.UserController));
    app.get("/api/users", authMiddleware.verifyToken(di.config.secret), authMiddleware.checkVerification, authMiddleware.checkRole([Role.Admin]), di.UserController.getUsers.bind(di.UserController));
    app.patch("/api/user/:id", authMiddleware.verifyToken(di.config.secret), authMiddleware.checkVerification, di.UserController.updateUser.bind(di.UserController));
    app.delete("/api/user/:id", authMiddleware.verifyToken(di.config.secret), authMiddleware.checkVerification, authMiddleware.checkRole([Role.Admin]), di.UserController.deleteUser.bind(di.UserController));
};
export default constructUserRoutes;
//# sourceMappingURL=user.js.map