import { UUID } from "../../src/types";
import { Role } from "../../src/types/auth";

declare global {
  namespace Express {
    interface Request {
        userId: UUID;
        role: Role;
    }
  }
}