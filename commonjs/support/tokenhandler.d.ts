import { Request } from "express";
import { AuthToken, AuthTokenAttributes } from "../types/auth";
import { Token } from "../types/token";
import { User } from "../types/user";
declare class TokenHandler {
    private tokenSecret;
    constructor(tokenSecret: string);
    generateUpdatedUserAuthToken(req: Request, newAttributes: AuthTokenAttributes): AuthToken;
    isPasswordTokenExpired(token: Token): boolean;
    generateShortToken(): string;
    generateUserAuthToken(user: User, req: Request): AuthToken;
}
export default TokenHandler;
