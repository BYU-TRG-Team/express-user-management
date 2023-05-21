import { UUID } from "@typings";
import { Role } from "@typings/auth";

declare global {
  namespace Express {
    interface Request {
        userId: UUID;
        role: Role;
        verified: boolean;
    }
  }
}