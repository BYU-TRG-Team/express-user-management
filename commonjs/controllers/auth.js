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
const auth_1 = require("../types/auth");
const cookie_1 = __importDefault(require("../config/cookie"));
class AuthController {
    constructor(smtpService, tokenHandler, db, logger) {
        this.smtpService = smtpService;
        this.tokenHandler = tokenHandler;
        this.db = db;
        this.logger = logger;
    }
    /*
    * POST /api/auth/signup
    * @username
    * @email
    * @password
    * @name
    */
    signup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let transactionInProgress = false;
            const client = yield this.db.pool.connect();
            try {
                const { username, email, password, name, } = req.body;
                if (username === undefined || email === undefined || password === undefined || name === undefined) {
                    res.status(400).send({ message: "Body must include username, email, password, and name" });
                    return;
                }
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                yield client.query("BEGIN");
                transactionInProgress = true;
                const userResponse = yield this.db.objects.User.create(username, email, hashedPassword, 1, name, client);
                const newUser = userResponse.rows[0];
                let emailVerificationToken;
                while (emailVerificationToken === undefined) {
                    const shortToken = this.tokenHandler.generateShortToken();
                    try {
                        yield this.db.objects.Token.create(newUser.user_id, shortToken, auth_1.SessionTokenType.Verification, client);
                        emailVerificationToken = shortToken;
                    }
                    catch (e) {
                        if (e.code === "23505") {
                            continue;
                        }
                        throw new Error(`Error creating a verification token. PG error code ${e.code}`);
                    }
                }
                yield this.sendVerificationEmail(req, newUser, emailVerificationToken);
                yield client.query("COMMIT");
                transactionInProgress = false;
                res.status(204).send();
                return;
            }
            catch (err) {
                this.logger.log({
                    level: "error",
                    message: err,
                });
                res.status(500).send({ message: errors_1.default.generic });
            }
            finally {
                if (transactionInProgress) {
                    yield client.query("ROLLBACK");
                }
                client.release();
            }
        });
    }
    /*
    * POST /api/auth/signin
    * @username
    * @password
    */
    signin(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username, password } = req.body;
                if (username === undefined || password === undefined) {
                    res.status(400).send({ message: "Body must include a username and password" });
                    return;
                }
                const userResponse = yield this.db.objects.User.findUsers(["username"], [username]);
                if (userResponse.rows.length === 0) {
                    res.status(400).send({ message: errors_1.default.loginError });
                    return;
                }
                const user = userResponse.rows[0];
                const passwordIsValid = bcrypt_1.default.compareSync(password, user.password);
                if (!passwordIsValid) {
                    res.status(400).send({
                        message: errors_1.default.loginError,
                    });
                    return;
                }
                const token = this.tokenHandler.generateUserAuthToken(user, req);
                res.cookie(cookie_1.default.cookieName, token, cookie_1.default.generateCookieOptions(Date.now()));
                res.json({ token });
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
    * GET /api/auth/logout
    */
    logout(_req, res) {
        try {
            res.clearCookie(cookie_1.default.cookieName, { path: "/" }).send();
            return;
        }
        catch (err) {
            this.logger.log({
                level: "error",
                message: err,
            });
            res.status(500).send({ message: errors_1.default.generic });
        }
    }
    /*
    * GET api/auth/verify/:token
    */
    verify(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Find a matching token
                const verifyTokenResponse = yield this.db.objects.Token.findTokens(["token", "type"], [req.params.token, auth_1.SessionTokenType.Verification]);
                if (verifyTokenResponse.rows.length === 0) {
                    res.redirect("/login");
                    return;
                }
                const verifyToken = verifyTokenResponse.rows[0];
                // Find associated user
                const userResponse = yield this.db.objects.User.findUsers(["user_id"], [verifyToken.user_id]);
                if (userResponse.rows.length === 0) {
                    res.status(500).send({ message: errors_1.default.generic });
                    return;
                }
                const user = userResponse.rows[0];
                // Set user as verified
                yield this.db.objects.User.setAttributes(["verified"], [true], user.user_id);
                yield this.db.objects.Token.deleteToken(verifyToken.token);
                res.redirect("/login");
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
    * POST api/auth/recovery
    * @email
    */
    recovery(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.body;
                if (email === undefined) {
                    res.status(400).send({ message: "Body must include email" });
                    return;
                }
                const userResponse = yield this.db.objects.User.findUsers(["email"], [email]);
                if (userResponse.rows.length === 0) {
                    res.redirect("/recover/sent");
                    return;
                }
                const user = userResponse.rows[0];
                yield this.sendPasswordResetEmail(req, user);
                res.redirect("/recover/sent");
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
    * GET api/auth/recovery/verify/:token
    */
    verifyRecovery(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tokenResponse = yield this.db.objects.Token.findTokens(["token", "type"], [req.params.token, auth_1.SessionTokenType.Password]);
                if (tokenResponse.rows.length === 0) {
                    res.status(400).send({ message: errors_1.default.generic });
                    return;
                }
                const token = tokenResponse.rows[0];
                if (this.tokenHandler.isPasswordTokenExpired(token)) {
                    res.status(400).send({ message: errors_1.default.generic });
                    return;
                }
                res.redirect(`/recover/${req.params.token}`);
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
    /* POST api/auth/recovery/:token
    * @password
    */
    processRecovery(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { password } = req.body;
            if (password === undefined) {
                res.status(400).json({ message: "Body must include password" });
                return;
            }
            try {
                const tokenResponse = yield this.db.objects.Token.findTokens(["token", "type"], [req.params.token, auth_1.SessionTokenType.Password]);
                if (tokenResponse.rows.length === 0) {
                    res.status(400).send({ message: errors_1.default.generic });
                    return;
                }
                const token = tokenResponse.rows[0];
                if (this.tokenHandler.isPasswordTokenExpired(token)) {
                    res.status(400).send({ message: errors_1.default.generic });
                    return;
                }
                const userResponse = yield this.db.objects.User.findUsers(["user_id"], [token.user_id]);
                if (userResponse.rows.length === 0) {
                    res.status(500).send({ message: errors_1.default.generic });
                    return;
                }
                const user = userResponse.rows[0];
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                yield this.db.objects.User.setAttributes(["password"], [hashedPassword], token.user_id);
                yield this.db.objects.Token.deleteToken(req.params.token);
                const authToken = this.tokenHandler.generateUserAuthToken(user, req);
                res.cookie(cookie_1.default.cookieName, authToken, cookie_1.default.generateCookieOptions(Date.now()));
                res.send({ token: authToken });
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
    sendVerificationEmail(req, user, token) {
        const link = `http://${req.headers.host}/api/auth/verify/${token}`;
        const emailOptions = {
            subject: "Account Verification Request",
            to: user.email,
            from: this.smtpService.hostAddress,
            html: `
      <p>Hi ${user.username},</p>
      <p>Please visit this <a href="${link}">link</a> to verify your account.</p> 
      <p>If you did not request this, please ignore this email.</p>`,
        };
        return this.smtpService.sendEmail(emailOptions);
    }
    sendPasswordResetEmail(req, user) {
        return __awaiter(this, void 0, void 0, function* () {
            let resetPasswordToken;
            while (resetPasswordToken === undefined) {
                const shortToken = this.tokenHandler.generateShortToken();
                try {
                    yield this.db.objects.Token.create(user.user_id, shortToken, auth_1.SessionTokenType.Password);
                    resetPasswordToken = shortToken;
                }
                catch (e) {
                    if (e.code === 23505) {
                        continue;
                    }
                    throw new Error(`Error creating a verification token. PG error code ${e.code}`);
                }
            }
            const link = `http://${req.headers.host}/api/auth/recovery/verify/${resetPasswordToken}`;
            const emailOptions = {
                subject: "Password Recovery Request",
                to: user.email,
                from: this.smtpService.hostAddress,
                html: `
      <p>Hi ${user.username},</p>
      <p>Please visit this <a href="${link}">link</a> to reset your password.</p> 
      <p>If you did not request this, please ignore this email.</p>`,
            };
            return this.smtpService.sendEmail(emailOptions);
        });
    }
}
exports.default = AuthController;
//# sourceMappingURL=auth.js.map