"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const errors_1 = __importDefault(require("../messages/errors"));
const cookie_1 = __importDefault(require("../config/cookie"));
const auth_1 = require("../types/auth");
class UserController {
    constructor(tokenHandler, logger, db) {
        this.tokenHandler = tokenHandler;
        this.logger = logger;
        this.db = db;
    }
    /*
    * PATCH /api/user/:id
    * @username (optional)
    * @email (optional)
    * @name (optional)
    * @password (optional)
    * @roleId (optional)
    */
    updateUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const isClientUser = req.userId === req.params.id;
                const newAttributes = {};
                const superadminNewAttributes = {};
                Object.keys(req.body).forEach((attr) => {
                    if (["username", "email", "name", "password"].includes(attr)) {
                        newAttributes[attr] = req.body[attr];
                    }
                    if (["roleId"].includes(attr)) {
                        superadminNewAttributes[attr] = req.body[attr];
                    }
                });
                if (newAttributes.password !== undefined) {
                    newAttributes.password = yield bcrypt_1.default.hash(newAttributes.password, 10);
                }
                if (isClientUser
                    && Object.keys(newAttributes).length > 0) {
                    const attributes = [];
                    const values = [];
                    Object.keys(newAttributes).forEach((attr) => { attributes.push(attr); values.push(newAttributes[attr]); });
                    yield this.db.objects.User.setAttributes(attributes, values, req.userId);
                }
                // Update these attributes regardless of whether the param id is equal to the client's id
                if (req.role === auth_1.Role.Admin
                    && Object.keys(superadminNewAttributes).length > 0) {
                    const attributes = ["role_id"];
                    const values = [superadminNewAttributes.roleId];
                    yield this.db.objects.User.setAttributes(attributes, values, req.params.id);
                }
                if (newAttributes.username) {
                    const newToken = yield this.tokenHandler.generateUpdatedUserAuthToken(req, newAttributes);
                    res.cookie(cookie_1.default.cookieName, newToken, cookie_1.default.generateCookieOptions(Date.now()));
                    res.send({ newToken });
                    return;
                }
                res.status(204).send();
            }
            catch (err) {
                this.logger.log({
                    level: "error",
                    message: err,
                });
                res.status(500).send({ message: errors_1.default.generic });
            }
        });
    }
    /*
    * GET /api/user/:id
    */
    getUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (req.params.id !== req.userId) {
                    return res.status(400).send({ message: errors_1.default.generic });
                }
                const usersQuery = yield this.db.objects.User.findUsers(["user_id"], [req.params.id]);
                if (usersQuery.rows.length === 0) {
                    return res.status(404).send({ message: errors_1.default.notFound });
                }
                const { email, username, name } = usersQuery.rows[0];
                return res.status(200).send({
                    email, username, name,
                });
            }
            catch (err) {
                this.logger.log({
                    level: "error",
                    message: err,
                });
                return res.status(500).send({ message: errors_1.default.generic });
            }
        });
    }
    /*
    * GET /api/users
    */
    getUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const usersQuery = yield this.db.objects.User.getAllUsers();
                return res.json({ users: usersQuery.rows });
            }
            catch (err) {
                this.logger.log({
                    level: "error",
                    message: err,
                });
                return res.status(500).send({ message: errors_1.default.generic });
            }
        });
    }
    /*
    * DELETE /api/user/:id
    */
    deleteUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.db.objects.User.deleteUser(req.params.id);
                res.status(204).send();
            }
            catch (err) {
                this.logger.log({
                    level: "error",
                    message: err,
                });
                res.status(500).send({ message: errors_1.default.generic });
            }
        });
    }
}
exports.default = UserController;
//# sourceMappingURL=user.js.map