import { Logger } from "winston";
import TokenHandler from "../support/tokenhandler";
import SmtpService from "../services/smtp";
import DB from "../db";
import { Response, Request } from "express";
import { User } from "../types/user";
declare class AuthController {
    private smtpService;
    private tokenHandler;
    private db;
    private logger;
    constructor(smtpService: SmtpService, tokenHandler: TokenHandler, db: DB, logger: Logger);
    signup(req: Request, res: Response): Promise<void>;
    signin(req: Request, res: Response): Promise<void>;
    logout(_req: Request, res: Response): void;
    verify(req: Request, res: Response): Promise<void>;
    recovery(req: Request, res: Response): Promise<void>;
    verifyRecovery(req: Request, res: Response): Promise<void>;
    processRecovery(req: Request, res: Response): Promise<void>;
    sendVerificationEmail(req: Request, user: User, token: string): Promise<unknown>;
    sendPasswordResetEmail(req: Request, user: User): Promise<unknown>;
}
export default AuthController;
