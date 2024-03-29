import { Role } from "@typings/auth";
import { UUID } from "@typings";

/*
* TODO: update all references to user_id to utilize UUID (tests, service functions)
*/
export type User = {
  user_id: UUID;
  username: string;
  verified: boolean;
  password: string;
  email: string;
  name: string;
  role_id: Role;
}