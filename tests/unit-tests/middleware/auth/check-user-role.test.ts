import { getMockReq, getMockRes } from "@jest-mock/express";
import { checkUserRole } from "@middleware/auth";
import { Role } from "@typings/auth";

describe("tests checkUserRole middleware", () => {  
  test("should accept an authorized user", () => {
    const { res, next } = getMockRes();
    const req = getMockReq({
      role: Role.Admin
    });
    
    // Invoke middleware
    checkUserRole([Role.Admin])(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("should reject an unauthorized user", () => {
    const { res, next } = getMockRes();
    const req = getMockReq({
      role: Role.Admin
    });
    
    // Invoke middleware
    checkUserRole([
      Role.User,
      Role.Staff
    ])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
