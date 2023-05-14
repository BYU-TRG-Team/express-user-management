import { getMockReq, getMockRes } from "@jest-mock/express";
import constructBottle from "@bottle";
import * as mockConstants from "@tests/constants";
import { Role } from "@typings/auth";

jest.mock("pg");
jest.mock("nodemailer");

describe("tests recovery method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test("should throw a 400 error for invalid body", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {},
    });
    const { res } = getMockRes();

    await bottle.container.AuthController.recovery(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: "Body must include email" 
    });
  });

  test("should redirect to /recover/sent but not send a password reset email", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        email: "TEST"
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
    jest.spyOn(bottle.container.AuthController, "sendPasswordResetEmail");

    await bottle.container.AuthController.recovery(req, res);

    expect(bottle.container.DBClient.objects.User.findUsers).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.User.findUsers).toHaveBeenCalledWith({
      "email": req.body.email,
    });

    expect(bottle.container.AuthController.sendPasswordResetEmail).toHaveBeenCalledTimes(0);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/recover/sent");
  });

  test("should redirect to /recover/sent and send a password reset email", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        email: "TEST"
      },
    });
    const { res } = getMockRes();
    const mockUser = {
      user_id: "TEST", 
      verified: true, 
      role_id: Role.Admin, 
      username: "TEST",
      password: "TEST",
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
    jest.spyOn(bottle.container.AuthController, "sendPasswordResetEmail");

    await bottle.container.AuthController.recovery(req, res);

    expect(bottle.container.DBClient.objects.User.findUsers).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.User.findUsers).toHaveBeenCalledWith({
      "email": req.body.email,
    });

    expect(bottle.container.AuthController.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(bottle.container.AuthController.sendPasswordResetEmail).toHaveBeenCalledWith(
      req,
      mockUser
    );
    
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/recover/sent");
  });
});
