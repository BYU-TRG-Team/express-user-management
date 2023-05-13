import jwt from "jsonwebtoken";
import { getMockReq, getMockRes } from "@jest-mock/express";
import * as errorMessages from "@constants/errors/messages";
import * as authMiddleware from "@middleware/auth";
import { MOCK_AUTH_SECRET } from "@tests/constants";
import { Role } from "@typings/auth";
import * as cookieConfig from "@constants/http/cookie";

describe("tests checkVerification method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test("should call next due to verified token", async () => {
    const authToken = jwt.sign({
      id: 1, 
      role: Role.Admin, 
      verified: true, 
      username: "test", 
      rememberMe: false,
    }, MOCK_AUTH_SECRET, {
      expiresIn: 604800, //  1 week
    });
    const req = getMockReq({
      cookies: {
        [cookieConfig.NAME]: authToken
      },
    });
    const { res, next } = getMockRes();

    authMiddleware.checkVerification(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("should fail with 403 due to invalid or unverified token", async () => {
    const authToken = jwt.sign({
      id: 1, 
      role: Role.Admin, 
      verified: false, 
      username: "test", 
      rememberMe: false,
    }, MOCK_AUTH_SECRET, {
      expiresIn: 604800, //  1 week
    });
    const req = getMockReq({
      cookies: {
        [cookieConfig.NAME]: authToken
      },
    });
    const { res, next } = getMockRes();
    
    authMiddleware.checkVerification(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      message: errorMessages.ACCESS_FORBIDDEN
    });
  });
});
