import { Role } from "../../src/types/auth";

declare global{
    namespace Express {
        interface Request {
            userId: number;
            role: Role;
        }
    }

    namespace jest {
        interface Matchers<R> {
            toBeArrayWithElements(expected: any[]): CustomMatcherResult;
        }
      }
}