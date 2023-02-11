import request from "../../../../__mocks__/request";
import response from "../../../../__mocks__/response";
import mockDB from "../../../../__mocks__/db";
import DB from "../../../../src/db";
import logger from "../../../../__mocks__/logger";
import AuthController from "../../../../src/controllers/auth";
import TokenHandler from "../../../../src/support/tokenhandler";
import mockUser from "../../../../__mocks__/user";
import mockToken from "../../../../__mocks__/token";
import smtpService from "../../../../__mocks__/smtpService";
import { Logger } from "winston";
import SmtpService from "../../../../src/services/smtp";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { SessionTokenType } from "../../../../src/types/auth";

describe("tests signup method", () => {
  it("should throw a 400 error", async () => {
    const mockedSmtpService = smtpService();
    const mockedDb = mockDB(mockUser(), mockToken());
    const mockedLogger = logger();
    const tokenHandler = new TokenHandler("test");

    const authController = new AuthController(
      mockedSmtpService as unknown as SmtpService, 
      tokenHandler,
      mockedDb as unknown as DB, 
      mockedLogger as unknown as Logger
    );

    const req = request({
      body: {
        username: "test",
        email: "test",
        password: "test",
      },
      role: "user",
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, "status");
    await authController.signup(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should create a new user and send a verification email", async () => {
    const mockedSmtpService = smtpService();
    const mockedUser = mockUser({
      create: jest.fn(() => ({
        rows: [{
          user_id: 1,
          username: "test",
          verified: true,
          password: "test",
          email: "test",
          name: "test",
          role_id: 1
        }],
      }))
    });
    const mockedDb = mockDB(mockedUser, mockToken());
    const mockedLogger = logger();
    const tokenHandler = new TokenHandler("test");

    const authController = new AuthController(
      mockedSmtpService as unknown as SmtpService, 
      tokenHandler,
      mockedDb as unknown as DB, 
      mockedLogger as unknown as Logger
    );

    const req = request({
      body: {
        username: "test",
        email: "test",
        password: "test",
        name: "test",
      },
      headers: {
        host: "test",
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, "status");
    jest.spyOn(res, "send");
    jest.spyOn(authController, "sendVerificationEmail");
    await authController.signup(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(204);

    expect(res.send).toHaveBeenCalledTimes(1);

    expect(authController.sendVerificationEmail).toHaveBeenCalledTimes(1);
    const verificationEmailCall = (authController.sendVerificationEmail as any).mock.calls[0];
    expect(verificationEmailCall[0]).toStrictEqual(req);
    expect(verificationEmailCall[1]).toStrictEqual({
      "email": "test",
      "name": "test",
      "password": "test",
      "role_id": 1,
      "user_id": 1,
      "username": "test",
      "verified": true,
    });
    const verificationToken = verificationEmailCall[2];

    expect(mockedDb.objects.User.create).toHaveBeenCalledTimes(1);
    const createUserCall = mockedDb.objects.User.create.mock.calls[0];
    expect(createUserCall[0]).toBe(req.body.username);
    expect(createUserCall[1]).toBe(req.body.email);
    expect(createUserCall[3]).toBe(1);
    expect(createUserCall[4]).toBe(req.body.name);
    expect(createUserCall[5]).not.toBeUndefined();
    const passwordIsValid = bcrypt.compareSync(
      "test",
      createUserCall[2],
    );
    expect(passwordIsValid).toBeTruthy();

    expect(mockedDb.pool.query).toHaveBeenCalledTimes(2);
    const mockFirstQueryCall = mockedDb.pool.query.mock.calls[0];
    const mockSecondQueryCall = mockedDb.pool.query.mock.calls[1];
    expect(mockFirstQueryCall[0]).toBe("BEGIN");
    expect(mockSecondQueryCall[0]).toBe("COMMIT");

    expect(mockedDb.objects.Token.create).toHaveBeenCalledTimes(1);
    const createTokenCall = mockedDb.objects.Token.create.mock.calls[0];
    expect(createTokenCall[0]).toBe(1);
    expect(createTokenCall[1]).toBe(verificationToken);
    expect(createTokenCall[2]).toBe(SessionTokenType.Verification);
  });
});
