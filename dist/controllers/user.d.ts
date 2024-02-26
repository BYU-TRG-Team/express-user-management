import TokenHandler from "../support/tokenhandler";
import { Logger } from "winston";
import DB from "../db";
import { Request, Response } from "express";
declare class UserController {
    private logger;
    private db;
    private tokenHandler;
    constructor(tokenHandler: TokenHandler, logger: Logger, db: DB);
    updateUser(req: Request, res: Response): Promise<void>;
    getUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getUsers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteUser(req: Request, res: Response): Promise<void>;
}
export default UserController;
