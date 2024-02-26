"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const authMiddleware = __importStar(require("../middleware/auth"));
const auth_1 = require("../types/auth");
const constructUserRoutes = (app, di) => {
    app.get("/api/user/:id", authMiddleware.verifyToken(di.config.secret), authMiddleware.checkVerification, di.UserController.getUser.bind(di.UserController));
    app.get("/api/users", authMiddleware.verifyToken(di.config.secret), authMiddleware.checkVerification, authMiddleware.checkRole([auth_1.Role.Admin]), di.UserController.getUsers.bind(di.UserController));
    app.patch("/api/user/:id", authMiddleware.verifyToken(di.config.secret), authMiddleware.checkVerification, di.UserController.updateUser.bind(di.UserController));
    app.delete("/api/user/:id", authMiddleware.verifyToken(di.config.secret), authMiddleware.checkVerification, authMiddleware.checkRole([auth_1.Role.Admin]), di.UserController.deleteUser.bind(di.UserController));
};
exports.default = constructUserRoutes;
//# sourceMappingURL=user.js.map