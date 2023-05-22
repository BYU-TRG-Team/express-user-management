import jwt from "jsonwebtoken";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { verifyHTTPCookie } from "@middleware/auth";
import { generateHTTPCookieJWTPayload } from "@tests/helpers/auth";
import { TEST_AUTH_CONFIG } from "@tests/constants";

describe("tests verifyHTTPCookie middleware", () => {  
  test("should verify a valid JWT", () => {
    const payload = generateHTTPCookieJWTPayload();
    const token = jwt.sign(payload, TEST_AUTH_CONFIG.httpCookieSecret);
    const req = getMockReq({
      cookies: {
        [TEST_AUTH_CONFIG.httpCookieName]: token
      },
    });
    const { res, next } = getMockRes();
    
    verifyHTTPCookie(TEST_AUTH_CONFIG)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toStrictEqual(payload.id);
    expect(req.role).toStrictEqual(payload.role);
    expect(req.verified).toStrictEqual(payload.verified);
  });

  test("should reject an invalid JWT", () => {
    const payload = generateHTTPCookieJWTPayload();
    const token = jwt.sign(payload, `${TEST_AUTH_CONFIG.httpCookieSecret}_FOO`);
    const req = getMockReq({
      cookies: {
        [TEST_AUTH_CONFIG.httpCookieName]: token
      },
    });
    const { res, next } = getMockRes();
    
    verifyHTTPCookie(TEST_AUTH_CONFIG)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
