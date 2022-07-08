import { UUID } from "types";
import { Role } from "../../src/types/auth";

declare global{
    namespace Express {
        interface Request {
            userId: UUID;
            role: Role;
        }
    }

    namespace jest {
        interface Matchers<R> {
            toBeArrayWithElements(expected: any[]): CustomMatcherResult;
        }
      }
}