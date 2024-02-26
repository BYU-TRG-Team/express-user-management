import { Role } from "./auth";
import { UUID } from "./index";
export declare type User = {
    user_id: UUID;
    username: string;
    verified: boolean;
    password: string;
    email: string;
    name: string;
    role_id: Role;
};
