"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const pg_1 = __importDefault(require("pg"));
const index_1 = __importDefault(require("../db/index"));
const user_1 = __importDefault(require("../db/user"));
const smtp_1 = __importDefault(require("../services/smtp"));
const token_1 = __importDefault(require("../db/token"));
const auth_1 = __importDefault(require("../controllers/auth"));
const user_2 = __importDefault(require("../controllers/user"));
const tokenhandler_1 = __importDefault(require("../support/tokenhandler"));
function dependencyInjection({ smtpConfig, logger, dbConfig, authConfig }) {
    // SMTP Transporter
    const smtpTransporter = nodemailer_1.default.createTransport(smtpConfig.transporterConfig);
    // Support
    const tokenHandler = new tokenhandler_1.default(authConfig.secret);
    // DB
    const connectionPool = new pg_1.default.Pool(dbConfig);
    const user = new user_1.default(connectionPool);
    const token = new token_1.default(connectionPool);
    const db = new index_1.default(connectionPool, {
        User: user,
        Token: token,
    });
    // Services
    const smtpService = new smtp_1.default(smtpTransporter, smtpConfig.email);
    // Controllers
    const authController = new auth_1.default(smtpService, tokenHandler, db, logger);
    const userController = new user_2.default(tokenHandler, logger, db);
    return {
        AuthController: authController,
        UserController: userController,
        config: {
            secret: authConfig.secret
        },
        DB: db,
    };
}
exports.default = dependencyInjection;
//# sourceMappingURL=index.js.map