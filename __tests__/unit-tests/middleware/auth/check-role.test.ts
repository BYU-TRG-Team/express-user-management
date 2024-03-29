import jwt from "jsonwebtoken";
import { getMockReq, getMockRes } from "@jest-mock/express";
import * as errorMessages from "@constants/errors/messages";
import * as authMiddleware from "@middleware/auth";
import { MOCK_AUTH_SECRET } from "@tests/constants";
import { Role } from "@typings/auth";
import * as cookieConfig from "@constants/http/cookie";

describe("tests checkRole method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it("should call next due to token including specified role", async () => {
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
    
    authMiddleware.checkRole([Role.User, Role.Admin])(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should fail with a 403 for token not including specified role", async () => {
    const authToken = jwt.sign({
      id: 1, 
      role: Role.Staff, 
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

    authMiddleware.checkRole([Role.User, Role.Admin])(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      message: errorMessages.ACCESS_FORBIDDEN
    });
  });
});
