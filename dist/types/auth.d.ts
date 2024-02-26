import { UUID } from "../types";
export declare enum Role {
    Admin = 3,
    Staff = 2,
    User = 1,
    Inactive = 0
}
export declare enum SessionTokenType {
    Password = "password",
    Verification = "verification"
}
export declare type AuthToken = {
    id: UUID;
    role: Role;
    verified: boolean;
    username: string;
};
export declare type AuthTokenAttributes = {
    id?: number;
    role?: Role;
    verified?: boolean;
    username?: string;
};
export declare type AuthConfig = {
    secret: string;
};
