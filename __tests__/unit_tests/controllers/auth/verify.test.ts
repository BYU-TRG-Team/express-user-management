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
import { Request, Response } from "express";
import { Role, SessionTokenType } from "../../../../src/types/auth";
import "../../../../custom-matchers";

describe("tests verify method", () => {
  it("should redirect to /login for invalid verify token", async () => {
    const mockedSmtpService = smtpService();
    const mockedToken = mockToken({
      findTokens: jest.fn(() => ({
        rows: []
      }))
    });
    const mockedDb = mockDB(mockUser(), mockedToken);
    const mockedLogger = logger();
    const tokenHandler = new TokenHandler("test");

    const authController = new AuthController(
      mockedSmtpService as unknown as SmtpService, 
      tokenHandler,
      mockedDb as unknown as DB, 
      mockedLogger as unknown as Logger
    );

    const req = request({
      params: {
        token: "test",
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, "redirect");
    await authController.verify(req, res);

    expect(mockedDb.objects.Token.findTokens).toBeCalledTimes(1);
    const mockFindTokensCall = mockedDb.objects.Token.findTokens.mock.calls[0];
    expect(mockFindTokensCall[0]).toBeArrayWithElements(["token", "type"]);
    expect(mockFindTokensCall[1]).toBeArrayWithElements([req.params.token, SessionTokenType.Verification]);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/login");
  });

  it("should set user as verified, remove token, and redirect to /login", async () => {
    const currentDate = new Date();
    const mockedSmtpService = smtpService();
    const mockedToken = mockToken({
      findTokens: jest.fn(() => ({
        rows: [{
          token: "test",
          user_id: 1,
          type: SessionTokenType.Verification,
          created_at: currentDate
        }]
      }))
    });
    const mockedUser = mockUser({
      findUsers: jest.fn(() => ({
        rows: [{
          user_id: 1,
          username: "test",
          verified: false,
          password: "asdfasdfasdf",
          name: "test",
          role_id: Role.Admin
        }]
      }))
    });
    const mockedDb = mockDB(mockedUser, mockedToken);
    const mockedLogger = logger();
    const tokenHandler = new TokenHandler("test");

    const authController = new AuthController(
      mockedSmtpService as unknown as SmtpService, 
      tokenHandler,
      mockedDb as unknown as DB, 
      mockedLogger as unknown as Logger
    );

    const req = request({
      params: {
        token: "test",
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, "redirect");
    await authController.verify(req, res);

    expect(mockedDb.objects.Token.findTokens).toBeCalledTimes(1);
    const mockFindTokensCall = mockedDb.objects.Token.findTokens.mock.calls[0];
    expect(mockFindTokensCall[0]).toBeArrayWithElements(["token", "type"]);
    expect(mockFindTokensCall[1]).toBeArrayWithElements([req.params.token, SessionTokenType.Verification]);

    expect(mockedDb.objects.User.findUsers).toBeCalledTimes(1);
    const mockFindUsersCall = mockedDb.objects.User.findUsers.mock.calls[0];
    expect(mockFindUsersCall[0]).toStrictEqual(["user_id"]);
    expect(mockFindUsersCall[1]).toStrictEqual([1]);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    const mockRedirectCall = (res.redirect as any).mock.calls[0];
    expect(mockRedirectCall[0]).toBe("/login");

    expect(mockedDb.objects.User.setAttributes).toBeCalledTimes(1);
    const mockSetAttributesCall = mockedDb.objects.User.setAttributes.mock.calls[0];
    expect(mockSetAttributesCall[0]).toStrictEqual(["verified"]);
    expect(mockSetAttributesCall[1]).toStrictEqual([true]);
    expect(mockSetAttributesCall[2]).toBe(1);

    expect(mockedDb.objects.Token.deleteToken).toBeCalledTimes(1);
    const mockDeleteTokenCall = mockedDb.objects.Token.deleteToken.mock.calls[0];
    expect(mockDeleteTokenCall[0]).toBe("test");
  });
});
