import pg from "pg";
import Token from "./token";
import User from "./user";
declare type DBObjects = {
    User: User;
    Token: Token;
};
declare class DB {
    pool: pg.Pool;
    objects: DBObjects;
    private static instance;
    constructor(pool: pg.Pool, objects: DBObjects);
}
export default DB;
