import { Role } from "@typings/auth";
import { UUID } from "@typings";
import { Pool, PoolClient } from "pg";

export type DBClient = Pool | PoolClient

export interface UserSchema {
  user_id: UUID;
  username: string;
  verified: boolean;
  password: string;
  email: string;
  name: string;
  role_id: Role;
}

export interface TokenSchema {
  token: string;
  user_id: UUID;
  type: string;
  created_at: Date;
}