import { Pool, PoolClient } from "pg";
import { UUID } from "../types/index";
import { SessionTokenType } from "../types/auth";
import { Token } from "../types/token";
declare class TokenObject {
    private db;
    constructor(db: Pool);
    create(userId: UUID, token: string, type: SessionTokenType, client?: PoolClient | Pool): Promise<import("pg").QueryResult<Token>>;
    deleteToken(token: string): Promise<import("pg").QueryResult<Token>>;
    findTokens(attributes: any[], values: any[]): Promise<import("pg").QueryResult<Token>>;
}
export default TokenObject;
