import bcrypt from "bcrypt";
import jwtDecode from "jwt-decode";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { Role, SessionTokenType } from "@typings/auth";
import constructBottle from "@bottle";
import * as mockConstants from "@tests/constants";
import { GENERIC_ERROR } from "@constants/errors";
import { HTTP_COOKIE_NAME } from "@constants/auth";
import { constructHTTPCookieConfig } from "@helpers/auth";
import UserRepository from "@db/repositories/user-repository";
import User from "@db/models/user";

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
    });
    const { res } = getMockRes();

    jest.spyOn(bottle.container.DBClient.objects.Token, "findTokens").mockResolvedValue({
      rows: [],
      command: "",
      oid: 0,
      rowCount: 0,
      fields: []
    });
    
    await bottle.container.AuthController.processRecovery(req, res);

    expect(bottle.container.DBClient.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.Token.findTokens).toHaveBeenCalledWith({
      "token": req.params.token,
      "type": SessionTokenType.Password
    });

    expect(res.status).toHaveBeenCalledWith(400);
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
    });
    const { res } = getMockRes();
    const mockToken = {
      created_at: new Date(Date.now() - 1800001), // Password reset token is considered expired after 30 minutes
      token: "TEST",
      type: SessionTokenType.Password,
      user_id: "TEST",
    };

    jest.spyOn(bottle.container.DBClient.objects.Token, "findTokens").mockResolvedValue({
      rows: [mockToken],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });

    await bottle.container.AuthController.processRecovery(req, res);

    expect(bottle.container.DBClient.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.Token.findTokens).toHaveBeenCalledWith({
      "token": req.params.token,
      "type": SessionTokenType.Password
    });

    expect(res.status).toHaveBeenCalledWith(400);
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
    const mockToken = {
      created_at: currentDate,
      token: "TEST",
      type: SessionTokenType.Password,
      user_id: "TEST",
    };
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
    jest.spyOn(bottle.container.DBClient.objects.Token, "findTokens").mockResolvedValue({
      rows: [mockToken],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });
    jest.spyOn(UserRepository.prototype, "getByUUID").mockResolvedValue(mockUser);
    jest.spyOn(UserRepository.prototype, "update");
    jest.spyOn(bottle.container.DBClient.objects.Token, "deleteToken");
    
    await bottle.container.AuthController.processRecovery(req, res);

    expect(bottle.container.DBClient.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.Token.findTokens).toHaveBeenCalledWith({
      "token": req.params.token,
      "type": SessionTokenType.Password
    });

    expect(UserRepository.prototype.getByUUID).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.getByUUID).toHaveBeenCalledWith(mockToken.user_id);

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

    expect(bottle.container.DBClient.objects.Token.deleteToken).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.Token.deleteToken).toHaveBeenCalledWith(req.params.token);

    expect(res.cookie).toBeCalledTimes(1);
    const mockCookieCall = (res.cookie as jest.Mock).mock.calls[0];
    expect(mockCookieCall[0]).toBe(HTTP_COOKIE_NAME);
    expect(jwtDecode(mockCookieCall[1])).toMatchObject({
      id: mockUser.userId,
      role: Role.Admin,
      verified: true,
      username: mockUser.username,
    });
    expect(mockCookieCall[2]).toStrictEqual(
      constructHTTPCookieConfig()
    );

    expect(res.send).toBeCalledTimes(1);
    const mockSendCall = (res.send as jest.Mock).mock.calls[0];
    expect(jwtDecode(mockSendCall[0].token)).toMatchObject({
      id: mockUser.userId,
      role: Role.Admin,
      verified: true,
      username: mockUser.username,
    });
  });
});
