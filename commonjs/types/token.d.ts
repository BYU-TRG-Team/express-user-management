import { UUID } from "./index";
export declare type Token = {
    token: string;
    user_id: UUID;
    type: string;
    created_at: Date;
};
