import jwt from "jsonwebtoken";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { verifyHTTPCookie } from "@middleware/auth";
import { TEST_AUTH_SECRET } from "@tests/constants";
import { HTTP_COOKIE_NAME } from "@constants/auth";
import { generateHTTPCookieJWTPayload } from "@tests/helpers";

describe("tests verifyHTTPCookie middleware", () => {  
  test("should verify a valid JWT", () => {
    const payload = generateHTTPCookieJWTPayload();
    const token = jwt.sign(payload, TEST_AUTH_SECRET);
    const req = getMockReq({
      cookies: {
        [HTTP_COOKIE_NAME]: token
      },
    });
    const { res, next } = getMockRes();
    
    verifyHTTPCookie(TEST_AUTH_SECRET)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toStrictEqual(payload.id);
    expect(req.role).toStrictEqual(payload.role);
    expect(req.verified).toStrictEqual(payload.verified);
  });

  test("should reject an invalid JWT", () => {
    const payload = generateHTTPCookieJWTPayload();
    const token = jwt.sign(payload, `${TEST_AUTH_SECRET}_FOO`);
    const req = getMockReq({
      cookies: {
        [HTTP_COOKIE_NAME]: token
      },
    });
    const { res, next } = getMockRes();
    
    verifyHTTPCookie(TEST_AUTH_SECRET)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
