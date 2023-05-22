import { getMockReq, getMockRes } from "@jest-mock/express";
import constructBottle from "@bottle";
import * as mockConstants from "@tests/constants";
import { Role } from "@typings/auth";
import UserRepository from "@db/repositories/user";
import User from "@db/models/user";
import TokenRepository from "@db/repositories/token";
import SMTPClient from "@smtp-client";

jest.mock("pg");
jest.mock("nodemailer");

describe("tests recovery method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test("should throw a 400 error for invalid body", async () => {
    const bottle = constructBottle(mockConstants.TEST_INIT_OPTIONS);
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
    const bottle = constructBottle(mockConstants.TEST_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        email: "TEST"
      },
    });
    const { res } = getMockRes();

    jest.spyOn(UserRepository.prototype, "getByEmail").mockResolvedValue(null);
    jest.spyOn(SMTPClient.prototype, "sendEmail");

    await bottle.container.AuthController.recovery(req, res);

    expect(UserRepository.prototype.getByEmail).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.getByEmail).toHaveBeenCalledWith(req.body.email);

    expect(SMTPClient.prototype.sendEmail).toHaveBeenCalledTimes(0);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/recover/sent");
  });

  test("should redirect to /recover/sent and send a password reset email", async () => {
    const bottle = constructBottle(mockConstants.TEST_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        email: "TEST"
      },
    });
    const { res } = getMockRes();
    const mockUser = new User({
      userId: "TEST", 
      verified: true, 
      roleId: Role.Admin, 
      username: "TEST",
      password: "TEST",
      email: "TEST",
      name: "TEST"
    });

    jest.spyOn(UserRepository.prototype, "getByEmail").mockResolvedValue(mockUser);
    jest.spyOn(SMTPClient.prototype, "sendEmail");
    jest.spyOn(TokenRepository.prototype, "getByUserIdAndType").mockResolvedValue(null);
    jest.spyOn(UserRepository.prototype, "create").mockResolvedValue();

    await bottle.container.AuthController.recovery(req, res);

    expect(UserRepository.prototype.getByEmail).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.getByEmail).toHaveBeenCalledWith(req.body.email);

    expect(SMTPClient.prototype.sendEmail).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/recover/sent");
  });
});
