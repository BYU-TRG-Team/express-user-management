import { UUID } from "@typings";

export enum Role {
  Admin = 3,
  Staff = 2,
  User = 1,
  Inactive = 0,
}

export enum SessionTokenType {
  Password = "password",
  Verification = "verification",
}

export type AuthToken = {
  id: UUID;
  role: Role;
  verified: boolean;
  username: string;
}

export type AuthTokenAttributes = {
  id?: number;
  role?: Role;
  verified?: boolean;
  username?: string;
}

export interface AuthConfig {
  secret: string;
}