import jwt from "jsonwebtoken";
import { getMockReq, getMockRes } from "@jest-mock/express";
import * as authMiddleware from "@middleware/auth";
import { MOCK_AUTH_SECRET } from "@tests/constants";
import { Role } from "@typings/auth";
import { AUTHORIZATION_ERROR } from "@constants/errors";
import { HTTP_COOKIE_NAME } from "@constants/auth";

describe("tests checkRole method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test("should call next due to token including specified role", async () => {
    const authToken = jwt.sign({
      id: 1, 
      role: Role.Admin, 
      verified: true, 
      username: "TEST", 
      rememberMe: false,
    }, MOCK_AUTH_SECRET, {
      expiresIn: 604800, //  1 week
    });
    const req = getMockReq({
      cookies: {
        [HTTP_COOKIE_NAME]: authToken
      },
    });
    const { res, next } = getMockRes();
    
    authMiddleware.checkRole([Role.User, Role.Admin])(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test("should fail with a 403 for token not including specified role", async () => {
    const authToken = jwt.sign({
      id: 1, 
      role: Role.Staff, 
      verified: true, 
      username: "TEST", 
      rememberMe: false,
    }, MOCK_AUTH_SECRET, {
      expiresIn: 604800, //  1 week
    });
    const req = getMockReq({
      cookies: {
        [HTTP_COOKIE_NAME]: authToken
      },
    });
    const { res, next } = getMockRes();

    authMiddleware.checkRole([Role.User, Role.Admin])(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      message: AUTHORIZATION_ERROR
    });
  });
});