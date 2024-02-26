import { Pool, PoolClient } from "pg";
import { UUID } from "../types/index";
import { Role } from "../types/auth";
import { User } from "../types/user";
declare class UserObject {
    private db;
    constructor(db: Pool);
    create(username: string, email: string, password: string, roleId: Role, name: string, client?: PoolClient | Pool): Promise<import("pg").QueryResult<User>>;
    setAttributes(attributes: any[], values: any[], userId: UUID): Promise<import("pg").QueryResult<User>>;
    findUsers(attributes: any[], values: any[]): Promise<import("pg").QueryResult<User>>;
    getAllUsers(): Promise<import("pg").QueryResult<User>>;
    deleteUser(userId: UUID): Promise<import("pg").QueryResult<User>>;
}
export default UserObject;
