import jwtDecode from "jwt-decode";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import CookieConfig from "../config/cookie";
class TokenHandler {
    constructor(tokenSecret) {
        this.tokenSecret = tokenSecret;
    }
    generateUpdatedUserAuthToken(req, newAttributes) {
        const oldToken = jwtDecode(req.cookies[CookieConfig.cookieName]);
        const newToken = jwt.sign(Object.assign(Object.assign({}, oldToken), newAttributes), this.tokenSecret);
        return newToken;
    }
    isPasswordTokenExpired(token) {
        const currentDate = new Date();
        return token.created_at.getTime() < (currentDate.getTime() - 1800000); // Password reset token is considered expired after 30 minutes
    }
    generateShortToken() {
        return crypto.randomBytes(20).toString("hex");
    }
    generateUserAuthToken(user, req) {
        const { verified, user_id, username, role_id, } = user;
        const token = jwt.sign({
            id: user_id, role: role_id, verified, username
        }, this.tokenSecret);
        return token;
    }
}
export default TokenHandler;
//# sourceMappingURL=tokenhandler.js.map