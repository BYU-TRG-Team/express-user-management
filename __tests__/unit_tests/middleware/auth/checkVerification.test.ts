import jwt from "jsonwebtoken";
import request from "../../../../__mocks__/request";
import response from "../../../../__mocks__/response";
import * as authMiddleware from "../../../../src/middleware/auth";
import { Role } from "../../../../src/types/auth";
import CookieConfig from "../../../../src/config/cookie";
import { Request, Response } from "express";

describe("tests checkVerification method", () => {
  it("should call next due to verified token", async () => {
    const authToken = jwt.sign({
      id: 1, role: Role.Admin, verified: true, username: "test", rememberMe: false,
    }, "test", {
      expiresIn: 604800, //  1 week
    });

    const req = request({
      cookies: {
        [CookieConfig.cookieName]: authToken,
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    const next = jest.fn();
    jest.spyOn(res, "status");
    jest.spyOn(res, "send");
    authMiddleware.checkVerification(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should fail with 403 due to invalid or unverified token", async () => {
    const authToken = jwt.sign({
      id: 1, role: Role.Admin, verified: false, username: "test", rememberMe: false,
    }, "test", {
      expiresIn: 604800, //  1 week
    });

    const req = request({
      cookies: {
        [CookieConfig.cookieName]: authToken,
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    const next = jest.fn();
    jest.spyOn(res, "status");
    jest.spyOn(res, "send");
    authMiddleware.checkVerification(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      message: "Access Forbidden",
    });

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
