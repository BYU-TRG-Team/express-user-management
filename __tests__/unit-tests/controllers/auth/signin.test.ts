import bcrypt from "bcrypt";
import jwtDecode from "jwt-decode";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { Role } from "@typings/auth";
import dependencyInjection from "@di";
import * as mockConstants from "@tests/constants";
import * as cookieConfig from "@constants/http/cookie";

jest.mock("pg");

describe("tests signin method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it("should throw a 400 error for invalid body", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: mockConstants.MOCK_USERNAME
      },
    });
    const { res } = getMockRes();

    await dependencyContainer.AuthController.signin(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: "Body must include a username and password" 
    });
  });

  it("should throw a 400 error for no found user", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: mockConstants.MOCK_USERNAME,
        password: mockConstants.MOCK_PASSWORD
      },
    });
    const { res } = getMockRes();

    jest.spyOn(dependencyContainer.DB.objects.User, "findUsers").mockResolvedValue({
      rows: [],
      command: "",
      oid: 0,
      rowCount: 0,
      fields: []
    });

    await dependencyContainer.AuthController.signin(req, res);

    expect(dependencyContainer.DB.objects.User.findUsers).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.User.findUsers).toBeCalledWith({
      "username": req.body.username
    });

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: "Username or password is incorrect. Please try again." 
    });
  });

  it("should throw a 400 error for invalid password", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: mockConstants.MOCK_USERNAME,
        password: mockConstants.MOCK_PASSWORD
      },
    });
    const { res } = getMockRes();
    const mockUser = {
      user_id: mockConstants.MOCK_UUID, 
      verified: true, 
      role_id: Role.Admin, 
      username: req.body.username,
      password: await bcrypt.hash(`${req.body.password}_GIBBERISH`, 10),
      email: mockConstants.MOCK_EMAIL,
      name: mockConstants.RANDOM_STRING
    };

    jest.spyOn(dependencyContainer.DB.objects.User, "findUsers").mockResolvedValue({
      rows: [mockUser],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });

    await dependencyContainer.AuthController.signin(req, res);

    expect(dependencyContainer.DB.objects.User.findUsers).toBeCalledWith({
      "username": req.body.username
    });

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: "Username or password is incorrect. Please try again." 
    });
  });

  it("should successfully return a jwt token", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: mockConstants.MOCK_USERNAME,
        password: mockConstants.MOCK_PASSWORD
      },
    });
    const { res } = getMockRes();
    const currentDate = new Date();
    const mockUser = {
      user_id: mockConstants.MOCK_UUID, 
      verified: true, 
      role_id: Role.Admin, 
      username: req.body.username,
      password: await bcrypt.hash(req.body.password, 10),
      email: mockConstants.MOCK_EMAIL,
      name: mockConstants.RANDOM_STRING
    };
    
    jest.spyOn(dependencyContainer.DB.objects.User, "findUsers").mockResolvedValue({
      rows: [mockUser],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });
    jest.spyOn(Date, "now").mockImplementation(() => currentDate.valueOf());

    await dependencyContainer.AuthController.signin(req, res);

    expect(dependencyContainer.DB.objects.User.findUsers).toBeCalledWith({
      "username": req.body.username
    });

    expect(res.cookie).toHaveBeenCalledTimes(1);
    const mockResCookieCall = (res.cookie as jest.Mock).mock.calls[0];
    expect(mockResCookieCall[0]).toBe(cookieConfig.NAME);
    expect(jwtDecode(mockResCookieCall[1])).toMatchObject({
      id: mockUser.user_id,
      role: Role.Admin,
      verified: true,
      username: mockUser.username,
    });
    expect(mockResCookieCall[2]).toMatchObject(cookieConfig.OPTIONS(currentDate.valueOf()));

    expect(res.json).toHaveBeenCalledTimes(1);
    const mockJsonCall = (res.json as jest.Mock).mock.calls[0];
    expect(jwtDecode(mockJsonCall[0].token)).toMatchObject({
      id: mockUser.user_id,
      role: Role.Admin,
      verified: true,
      username: mockUser.username,
    });
  });
});
