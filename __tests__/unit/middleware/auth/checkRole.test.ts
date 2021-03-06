import jwt from "jsonwebtoken";
import request from "../../../../__mocks__/request";
import response from "../../../../__mocks__/response";
import * as authMiddleware from "../../../../src/middleware/auth.middleware";
import { Role } from "../../../../src/types/auth";
import authConfig from "../../../../src/config/auth";
import { Request, Response } from "express";

describe('tests checkRole method', () => {
  it('should call next due to token including specified role', async () => {
    const authToken = jwt.sign({
      id: 1, role: Role.Admin, verified: true, username: 'test', rememberMe: false,
    }, 'test', {
      expiresIn: 604800, //  1 week
    });

    const req = request({
        cookies: {
          [authConfig.cookieName]: authToken
        },
      }
    ) as unknown as Request;

    const res = response() as unknown as Response;
    const next = jest.fn();
    jest.spyOn(res, 'status');
    jest.spyOn(res, 'send');
    authMiddleware.checkRole([Role.User, Role.Admin])(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledTimes(0);
    expect(res.send).toHaveBeenCalledTimes(0);
  });

  it('should fail with a 403 for token not including specified role', async () => {
    const authToken = jwt.sign({
      id: 1, role: Role.Staff, verified: true, username: 'test', rememberMe: false,
    }, 'test', {
      expiresIn: 604800, //  1 week
    });

    const req = request({
      cookies: {
        [authConfig.cookieName]: authToken,
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    const next = jest.fn();
    jest.spyOn(res, 'status');
    jest.spyOn(res, 'send');
    authMiddleware.checkRole([Role.User, Role.Admin])(req, res, next);

    expect(next).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Access Forbidden',
    });
  });
});
