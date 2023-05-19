import { UUID } from "@typings";

export enum Role {
  Admin = 3,
  Staff = 2,
  User = 1,
  Inactive = 0,
}

export enum OneTimeTokenType {
  Password = "password",
  Verification = "verification",
}

export interface HTTPCookieJWTPayload {
  id: UUID;
  role: Role;
  verified: boolean;
  username: string;
}

export interface OneTimeTokenJWTPayload {
  type: OneTimeTokenType,
  userId: UUID
}

export interface AuthConfig {
  httpCookieSecret: string;
}