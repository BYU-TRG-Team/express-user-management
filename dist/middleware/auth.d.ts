import { Request, Response, NextFunction } from "express";
import { Role } from "../types/auth";
export declare const verifyToken: (authSecret: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const checkVerification: (req: Request, res: Response, next: NextFunction) => void;
export declare const checkRole: (roles: Role[]) => (req: Request, res: Response, next: NextFunction) => void;
