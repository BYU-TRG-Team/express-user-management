import bcrypt from "bcrypt";
import jwtDecode from "jwt-decode";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { Role } from "@typings/auth";
import constructBottle from "@bottle";
import * as mockConstants from "@tests/constants";
import { HTTP_COOKIE_NAME } from "@constants/auth";
import { constructHTTPCookieConfig } from "@helpers/auth";

jest.mock("pg");

describe("tests signin method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test("should throw a 400 error for invalid body", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST"
      },
    });
    const { res } = getMockRes();

    await bottle.container.AuthController.signin(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: "Body must include a username and password" 
    });
  });

  test("should throw a 400 error for no found user", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST",
        password: "TEST"
      },
    });
    const { res } = getMockRes();

    jest.spyOn(bottle.container.DBClient.objects.User, "findUsers").mockResolvedValue({
      rows: [],
      command: "",
      oid: 0,
      rowCount: 0,
      fields: []
    });

    await bottle.container.AuthController.signin(req, res);

    expect(bottle.container.DBClient.objects.User.findUsers).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.User.findUsers).toBeCalledWith({
      "username": req.body.username
    });

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: "Username or password is incorrect. Please try again." 
    });
  });

  test("should throw a 400 error for invalid password", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST",
        password: "TEST"
      },
    });
    const { res } = getMockRes();
    const mockUser = {
      user_id: "TEST", 
      verified: true, 
      role_id: Role.Admin, 
      username: req.body.username,
      password: await bcrypt.hash(`${req.body.password}_GIBBERISH`, 10),
      email: "TEST",
      name: "TEST"
    };

    jest.spyOn(bottle.container.DBClient.objects.User, "findUsers").mockResolvedValue({
      rows: [mockUser],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });

    await bottle.container.AuthController.signin(req, res);

    expect(bottle.container.DBClient.objects.User.findUsers).toBeCalledWith({
      "username": req.body.username
    });

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: "Username or password is incorrect. Please try again." 
    });
  });

  test("should successfully return a jwt token", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST",
        password: "TEST"
      },
    });
    const { res } = getMockRes();
    const currentDate = new Date();
    const mockUser = {
      user_id: "TEST", 
      verified: true, 
      role_id: Role.Admin, 
      username: req.body.username,
      password: await bcrypt.hash(req.body.password, 10),
      email: "TEST",
      name: "TEST"
    };
    
    jest.spyOn(bottle.container.DBClient.objects.User, "findUsers").mockResolvedValue({
      rows: [mockUser],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });
    jest.spyOn(Date, "now").mockImplementation(() => currentDate.valueOf());

    await bottle.container.AuthController.signin(req, res);

    expect(bottle.container.DBClient.objects.User.findUsers).toBeCalledWith({
      "username": req.body.username
    });

    expect(res.cookie).toHaveBeenCalledTimes(1);
    const mockResCookieCall = (res.cookie as jest.Mock).mock.calls[0];
    expect(mockResCookieCall[0]).toBe(HTTP_COOKIE_NAME);
    expect(jwtDecode(mockResCookieCall[1])).toMatchObject({
      id: mockUser.user_id,
      role: Role.Admin,
      verified: true,
      username: mockUser.username,
    });
    expect(mockResCookieCall[2]).toMatchObject(
      constructHTTPCookieConfig()
    );

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
