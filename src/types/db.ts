import { Role } from "@typings/auth";
import { UUID } from "@typings";

export type UserSchema = {
  user_id: UUID;
  username: string;
  verified: boolean;
  password: string;
  email: string;
  name: string;
  role_id: Role;
}