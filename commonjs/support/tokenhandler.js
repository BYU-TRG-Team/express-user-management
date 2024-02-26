"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_decode_1 = __importDefault(require("jwt-decode"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const cookie_1 = __importDefault(require("../config/cookie"));
class TokenHandler {
    constructor(tokenSecret) {
        this.tokenSecret = tokenSecret;
    }
    generateUpdatedUserAuthToken(req, newAttributes) {
        const oldToken = (0, jwt_decode_1.default)(req.cookies[cookie_1.default.cookieName]);
        const newToken = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, oldToken), newAttributes), this.tokenSecret);
        return newToken;
    }
    isPasswordTokenExpired(token) {
        const currentDate = new Date();
        return token.created_at.getTime() < (currentDate.getTime() - 1800000); // Password reset token is considered expired after 30 minutes
    }
    generateShortToken() {
        return crypto_1.default.randomBytes(20).toString("hex");
    }
    generateUserAuthToken(user, req) {
        const { verified, user_id, username, role_id, } = user;
        const token = jsonwebtoken_1.default.sign({
            id: user_id, role: role_id, verified, username
        }, this.tokenSecret);
        return token;
    }
}
exports.default = TokenHandler;
//# sourceMappingURL=tokenhandler.js.map