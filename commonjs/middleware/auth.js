"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = exports.checkVerification = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_decode_1 = __importDefault(require("jwt-decode"));
const errors_1 = __importDefault(require("../messages/errors"));
const cookie_1 = __importDefault(require("../config/cookie"));
const verifyToken = (authSecret) => (req, res, next) => {
    const token = req.cookies[cookie_1.default.cookieName];
    if (!token) {
        res.status(401).send({
            message: errors_1.default.requestUnauthorized,
        });
        return;
    }
    jsonwebtoken_1.default.verify(token, authSecret, { ignoreExpiration: true }, (err, decoded) => {
        if (err) {
            res.status(403).send({
                message: errors_1.default.accessForbidden,
            });
            return;
        }
        const token = decoded;
        if (token) {
            req.userId = token.id;
            req.role = token.role;
        }
        next();
    });
};
exports.verifyToken = verifyToken;
const checkVerification = (req, res, next) => {
    const token = (0, jwt_decode_1.default)(req.cookies[cookie_1.default.cookieName]);
    if (token && token.verified) {
        next();
        return;
    }
    res.status(403).send({
        message: errors_1.default.accessForbidden,
    });
};
exports.checkVerification = checkVerification;
const checkRole = (roles) => (req, res, next) => {
    const token = (0, jwt_decode_1.default)(req.cookies[cookie_1.default.cookieName]);
    if (token && roles.includes(token.role)) {
        next();
        return;
    }
    res.status(403).send({
        message: errors_1.default.accessForbidden,
    });
};
exports.checkRole = checkRole;
//# sourceMappingURL=auth.js.map