import { getMockReq, getMockRes } from "@jest-mock/express";
import { checkUserVerification } from "@middleware/auth";

describe("tests checkUserVerification middleware", () => {  
  test("should accept a verified user", () => {
    const req = getMockReq({
      verified: true,
    });
    const { res, next } = getMockRes();
    
    checkUserVerification(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("should reject an unverified user", () => {
    const req = getMockReq({
      verified: false,
    });
    const { res, next } = getMockRes();
    
    checkUserVerification(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
