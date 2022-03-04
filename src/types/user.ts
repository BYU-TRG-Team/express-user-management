import { Role } from "./auth.js"

export type User = {
  user_id: number;
  username: string;
  verified: boolean;
  password: string;
  email: string;
  name: string;
  role_id: Role;
}