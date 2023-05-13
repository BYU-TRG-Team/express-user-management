import jwt from "jsonwebtoken";
import { getMockReq, getMockRes } from "@jest-mock/express";
import * as authMiddleware from "@middleware/auth";
import { MOCK_AUTH_SECRET } from "@tests/constants";
import { Role } from "@typings/auth";
import { AUTHENTICATION_ERROR, AUTHORIZATION_ERROR} from "@constants/errors";
import { HTTP_COOKIE_NAME } from "@constants/auth";

describe("tests verifyToken method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test("should call next due to valid token", async () => {
    const authToken = jwt.sign({
      id: 1, 
      role: Role.Admin, 
      verified: true, 
      username: "TEST",
    }, MOCK_AUTH_SECRET, {
      expiresIn: 604800, //  1 week
    });
    const req = getMockReq({
      cookies: {
        [HTTP_COOKIE_NAME]: authToken
      },
    });
    const { res, next } = getMockRes();
    
    authMiddleware.verifyToken(MOCK_AUTH_SECRET)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe(1);
    expect(req.role).toBe(Role.Admin);
  });

  test("should fail with 401 due to absent jwt token", async () => {
    const req = getMockReq();
    const { res, next } = getMockRes();

    authMiddleware.verifyToken(MOCK_AUTH_SECRET)(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      message: AUTHENTICATION_ERROR,
    });
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("should fail with 403 due to invalid jwt token", async () => {
    const authToken = jwt.sign({
      id: 1, 
      role: Role.Admin, 
      verified: true, 
      username: "TEST", 
      rememberMe: false,
    }, `${MOCK_AUTH_SECRET}_FOO`, {
      expiresIn: 604800, //  1 week
    });
    const req = getMockReq({
      cookies: {
        [HTTP_COOKIE_NAME]: authToken
      },
    });
    const { res, next } = getMockRes();

    authMiddleware.verifyToken(MOCK_AUTH_SECRET)(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      message: AUTHORIZATION_ERROR,
    });
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
