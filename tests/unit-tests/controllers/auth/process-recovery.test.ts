import bcrypt from "bcrypt";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { Role, OneTimeTokenType } from "@typings/auth";
import constructBottle from "@bottle";
import * as mockConstants from "@tests/constants";
import { GENERIC_ERROR } from "@constants/errors";
import { HTTP_COOKIE_NAME } from "@constants/auth";
import { constructHTTPCookieConfig } from "@helpers/auth";
import UserRepository from "@db/repositories/user-repository";
import User from "@db/models/user";
import TokenRepository from "@db/repositories/token-repository";
import Token from "@db/models/token";

jest.mock("pg");

describe("tests processRecovery method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test("should throw a 400 error due to an invalid body", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {},
      params: {
        token: "TEST",
      },
    });
    const { res } = getMockRes();

    await bottle.container.AuthController.processRecovery(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ 
      message: "Body must include password" 
    });
  });

  test("should throw a 400 error due to an invalid token", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        password: "TEST",
      },
      params: {
        token: "TEST",
      },
      query: {
        userId: "FOO"
      }
    });
    const { res } = getMockRes();

    jest.spyOn(TokenRepository.prototype, "getByUserIdAndType").mockResolvedValue(null);
    
    await bottle.container.AuthController.processRecovery(req, res);

    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledTimes(1);
    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledWith(
      req.query.userId,
      OneTimeTokenType.Password
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: GENERIC_ERROR
    });
  });

  test("should throw a 400 error due to an expired token", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        password: "TEST",
      },
      params: {
        token: "TEST",
      },
      query: {
        userId: "FOO"
      }
    });
    const { res } = getMockRes();
    const mockToken = new Token({
      createdAt: new Date(Date.now() - 1800001), // Password reset token is considered expired after 30 minutes
      token: "TEST",
      type: OneTimeTokenType.Password,
      userId: "TEST",
    });

    jest.spyOn(TokenRepository.prototype, "getByUserIdAndType").mockResolvedValue(mockToken);

    await bottle.container.AuthController.processRecovery(req, res);

    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledTimes(1);
    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledWith(
      req.query.userId,
      OneTimeTokenType.Password
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ message: 
      GENERIC_ERROR
    });
  });

  test("should successfully update password and return token and cookie", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        password: "FOO",
      },
      params: {
        token: "TEST",
      },
    });
    const { res } = getMockRes();
    const currentDate = new Date();
    const mockToken = new Token({
      createdAt: currentDate,
      token: "TEST",
      type: OneTimeTokenType.Password,
      userId: "TEST",
    });
    const mockUser = new User({
      userId: "TEST", 
      verified: true, 
      roleId: Role.Admin, 
      username: "TEST",
      password: "TEST",
      email: "TEST",
      name: "TEST"
    });

    jest.spyOn(Date, "now").mockImplementation(() => currentDate.valueOf());
    jest.spyOn(TokenRepository.prototype, "getByUserIdAndType").mockResolvedValue(mockToken);
    jest.spyOn(UserRepository.prototype, "getByUUID").mockResolvedValue(mockUser);
    jest.spyOn(UserRepository.prototype, "update");
    jest.spyOn(TokenRepository.prototype, "delete");
    
    await bottle.container.AuthController.processRecovery(req, res);

    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledTimes(1);
    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledWith(
      req.query.userId,
      OneTimeTokenType.Password
    );

    expect(UserRepository.prototype.getByUUID).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.getByUUID).toHaveBeenCalledWith(mockToken.userId);

    const updatedPassword = (
      (UserRepository.prototype.update as jest.Mock).mock.calls[0][0] as User
    ).password;
    const updatedUser = new User({
      ...mockUser,
      password: updatedPassword
    });
    expect(bcrypt.compareSync(
      req.body.password,
      updatedPassword,
    )).toBeTruthy();
    
    expect(UserRepository.prototype.update).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.update).toHaveBeenCalledWith(updatedUser);

    expect(TokenRepository.prototype.delete).toHaveBeenCalledTimes(1);
    expect(TokenRepository.prototype.delete).toHaveBeenCalledWith(mockToken);

    expect(res.cookie).toBeCalledTimes(1);
    const mockCookieCall = (res.cookie as jest.Mock).mock.calls[0];
    expect(mockCookieCall[0]).toBe(HTTP_COOKIE_NAME);
    // expect(jwtDecode(mockCookieCall[1])).toMatchObject({
    //   id: mockUser.userId,
    //   role: Role.Admin,
    //   verified: true,
    //   username: mockUser.username,
    // });
    expect(mockCookieCall[2]).toStrictEqual(
      constructHTTPCookieConfig()
    );

    expect(res.json).toBeCalledTimes(1);
    const mockJsonCall = (res.json as jest.Mock).mock.calls[0];
    // expect(jwtDecode(mockJsonCall[0].jwt)).toMatchObject({
    //   id: mockUser.userId,
    //   role: Role.Admin,
    //   verified: true,
    //   username: mockUser.username,
    // });
  });
});
