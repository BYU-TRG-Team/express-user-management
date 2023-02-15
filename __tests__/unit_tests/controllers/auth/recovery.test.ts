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
import "../../../../custom-matchers";
import { Request, Response } from "express";

describe("tests recovery method", () => {
  it("should throw a 400 error for invalid body", async () => {
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
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, "status");
    jest.spyOn(res, "send");
    await authController.recovery(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ message: "Body must include email" });
  });

  it("should redirect to /recover/sent but not send a password reset email", async () => {
    const mockedSmtpService = smtpService();
    const mockedUser = mockUser({
      findUsers: jest.fn(() => ({
        rows: []
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
        email: "test",
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, "redirect");
    jest.spyOn(authController, "sendPasswordResetEmail");
    await authController.recovery(req, res);

    expect(mockedDb.objects.User.findUsers).toHaveBeenCalledTimes(1);
    expect(mockedDb.objects.User.findUsers.mock.calls[0][0]).toBeArrayWithElements(["email"]);  
    expect(mockedDb.objects.User.findUsers.mock.calls[0][1]).toBeArrayWithElements([req.body.email]);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/recover/sent");

    expect(authController.sendPasswordResetEmail).toHaveBeenCalledTimes(0);
  });

  it("should redirect to /recover/sent and send a password reset email", async () => {
    const mockedSmtpService = smtpService();
    const mockedUser = mockUser({
      findUsers: jest.fn(() => ({
        rows: [{
          test: "test"
        }]
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
        email: "test",
      },
      headers: {
        host: "test",
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, "redirect");
    jest.spyOn(authController, "sendPasswordResetEmail");
    await authController.recovery(req, res);

    expect(mockedDb.objects.User.findUsers).toHaveBeenCalledTimes(1);
    expect(mockedDb.objects.User.findUsers.mock.calls[0][0]).toBeArrayWithElements(["email"]);  
    expect(mockedDb.objects.User.findUsers.mock.calls[0][1]).toBeArrayWithElements([req.body.email]);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/recover/sent");

    expect(authController.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const mockSendPasswordRestEmail = (authController as any).sendPasswordResetEmail.mock.calls[0];
    expect(mockSendPasswordRestEmail[0]).toStrictEqual(req);
    expect(mockSendPasswordRestEmail[1]).toStrictEqual({ test: "test" });
  });
});
