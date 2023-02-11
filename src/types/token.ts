import { UUID } from "./index";

export type Token = {
  token: string;
  user_id: UUID;
  type: string;
  created_at: Date;
}
