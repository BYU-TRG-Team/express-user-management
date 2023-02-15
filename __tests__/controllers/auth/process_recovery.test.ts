import bcrypt from "bcrypt";
import jwtDecode from "jwt-decode";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { Role, SessionTokenType } from "types/auth";
import dependencyInjection from "di/index";
import * as mockConstants from "tests/constants";
import * as errorMessages from "constants/errors/messages";
import * as cookieConfig from "constants/http/cookie";

jest.mock("pg");

describe("tests processRecovery method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it("should throw a 400 error due to an invalid body", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {},
      params: {
        token: mockConstants.MOCK_TOKEN,
      },
    });
    const { res } = getMockRes();

    await dependencyContainer.AuthController.processRecovery(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ 
      message: "Body must include password" 
    });
  });

  it("should throw a 400 error due to an invalid token", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        password: mockConstants.MOCK_PASSWORD,
      },
      params: {
        token: mockConstants.MOCK_TOKEN,
      },
    });
    const { res } = getMockRes();

    jest.spyOn(dependencyContainer.DB.objects.Token, "findTokens").mockResolvedValue({
      rows: [],
      command: "",
      oid: 0,
      rowCount: 0,
      fields: []
    });
    
    await dependencyContainer.AuthController.processRecovery(req, res);

    expect(dependencyContainer.DB.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.Token.findTokens).toHaveBeenCalledWith({
      "token": req.params.token,
      "type": SessionTokenType.Password
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: errorMessages.GENERIC
    });
  });

  it("should throw a 400 error due to an expired token", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        password: mockConstants.MOCK_PASSWORD,
      },
      params: {
        token: mockConstants.MOCK_TOKEN,
      },
    });
    const { res } = getMockRes();
    const mockToken = {
      created_at: new Date(Date.now() - 1800001), // Password reset token is considered expired after 30 minutes
      token: mockConstants.MOCK_TOKEN,
      type: SessionTokenType.Password,
      user_id: mockConstants.MOCK_UUID,
    };

    jest.spyOn(dependencyContainer.DB.objects.Token, "findTokens").mockResolvedValue({
      rows: [mockToken],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });

    await dependencyContainer.AuthController.processRecovery(req, res);

    expect(dependencyContainer.DB.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.Token.findTokens).toHaveBeenCalledWith({
      "token": req.params.token,
      "type": SessionTokenType.Password
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ message: 
      errorMessages.GENERIC
    });
  });

  it("should successfully update password and return token and cookie", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        password: mockConstants.MOCK_PASSWORD,
      },
      params: {
        token: mockConstants.MOCK_TOKEN,
      },
    });
    const { res } = getMockRes();
    const currentDate = new Date();
    const mockToken = {
      created_at: currentDate,
      token: mockConstants.MOCK_TOKEN,
      type: SessionTokenType.Password,
      user_id: mockConstants.MOCK_UUID,
    };
    const mockUser = {
      user_id: mockConstants.MOCK_UUID, 
      verified: true, 
      role_id: Role.Admin, 
      username: mockConstants.MOCK_USERNAME,
      password: mockConstants.MOCK_PASSWORD,
      email: mockConstants.MOCK_EMAIL,
      name: mockConstants.RANDOM_STRING
    };

    jest.spyOn(Date, "now").mockImplementation(() => currentDate.valueOf());
    jest.spyOn(dependencyContainer.DB.objects.Token, "findTokens").mockResolvedValue({
      rows: [mockToken],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });
    jest.spyOn(dependencyContainer.DB.objects.User, "findUsers").mockResolvedValue({
      rows: [mockUser],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });
    jest.spyOn(dependencyContainer.DB.objects.User, "setAttributes");
    jest.spyOn(dependencyContainer.DB.objects.Token, "deleteToken");
    
    await dependencyContainer.AuthController.processRecovery(req, res);

    expect(dependencyContainer.DB.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.Token.findTokens).toHaveBeenCalledWith({
      "token": req.params.token,
      "type": SessionTokenType.Password
    });

    expect(dependencyContainer.DB.objects.User.findUsers).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.User.findUsers).toHaveBeenCalledWith({
      "user_id": mockToken.user_id
    });

    expect(dependencyContainer.DB.objects.User.setAttributes).toHaveBeenCalledTimes(1);
    const mockSetAttributesCall = (dependencyContainer.DB.objects.User.setAttributes as jest.Mock).mock.calls[0];
    expect(mockSetAttributesCall[0]).toBe(mockUser.user_id);
    expect(Object.keys(mockSetAttributesCall[1]).length).toBe(1);
    expect(mockSetAttributesCall[1]).toHaveProperty("password");
    expect(bcrypt.compareSync(
      req.body.password,
      mockSetAttributesCall[1].password,
    )).toBeTruthy();

    expect(dependencyContainer.DB.objects.Token.deleteToken).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.Token.deleteToken).toHaveBeenCalledWith(req.params.token);

    expect(res.cookie).toBeCalledTimes(1);
    const mockCookieCall = (res.cookie as jest.Mock).mock.calls[0];
    expect(mockCookieCall[0]).toBe(cookieConfig.NAME);
    expect(jwtDecode(mockCookieCall[1])).toMatchObject({
      id: mockUser.user_id,
      role: Role.Admin,
      verified: true,
      username: mockUser.username,
    });
    expect(mockCookieCall[2]).toStrictEqual(cookieConfig.OPTIONS(currentDate.valueOf()));

    expect(res.send).toBeCalledTimes(1);
    const mockSendCall = (res.send as jest.Mock).mock.calls[0];
    expect(jwtDecode(mockSendCall[0].token)).toMatchObject({
      id: mockUser.user_id,
      role: Role.Admin,
      verified: true,
      username: mockUser.username,
    });
  });
});
