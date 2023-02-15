import { getMockReq, getMockRes } from "@jest-mock/express";
import dependencyInjection from "di/index";
import * as mockConstants from "tests/constants";
import { Role } from "types/auth";

jest.mock("pg");
jest.mock("nodemailer");

describe("tests recovery method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it("should throw a 400 error for invalid body", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {},
    });
    const { res } = getMockRes();

    await dependencyContainer.AuthController.recovery(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: "Body must include email" 
    });
  });

  it("should redirect to /recover/sent but not send a password reset email", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        email: mockConstants.MOCK_EMAIL
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
    jest.spyOn(dependencyContainer.AuthController, "sendPasswordResetEmail");

    await dependencyContainer.AuthController.recovery(req, res);

    expect(dependencyContainer.DB.objects.User.findUsers).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.User.findUsers).toHaveBeenCalledWith({
      "email": req.body.email,
    });

    expect(dependencyContainer.AuthController.sendPasswordResetEmail).toHaveBeenCalledTimes(0);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/recover/sent");
  });

  it("should redirect to /recover/sent and send a password reset email", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        email: mockConstants.MOCK_EMAIL
      },
    });
    const { res } = getMockRes();
    const mockUser = {
      user_id: mockConstants.MOCK_UUID, 
      verified: true, 
      role_id: Role.Admin, 
      username: mockConstants.MOCK_USERNAME,
      password: mockConstants.MOCK_PASSWORD,
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
    jest.spyOn(dependencyContainer.AuthController, "sendPasswordResetEmail");

    await dependencyContainer.AuthController.recovery(req, res);

    expect(dependencyContainer.DB.objects.User.findUsers).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.User.findUsers).toHaveBeenCalledWith({
      "email": req.body.email,
    });

    expect(dependencyContainer.AuthController.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.AuthController.sendPasswordResetEmail).toHaveBeenCalledWith(
      req,
      mockUser
    );
    
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/recover/sent");
  });
});
