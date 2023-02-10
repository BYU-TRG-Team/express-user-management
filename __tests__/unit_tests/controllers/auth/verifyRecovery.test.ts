import request from "../../../../__mocks__/request";
import response from "../../../../__mocks__/response";
import mockDB from "../../../../__mocks__/db";
import DB from "../../../../src/db";
import logger from "../../../../__mocks__/logger";
import AuthController from "../../../../src//controllers/auth.controller";
import TokenHandler from "../../../../src//support/tokenhandler.support";
import mockUser from "../../../../__mocks__/user";
import mockToken from "../../../../__mocks__/token";
import smtpService from "../../../../__mocks__/smtpService";
import { Logger } from "winston";
import SmtpService from "../../../../src/services/smtp.service";
import { Request, Response } from "express";
import { SessionTokenType } from "../../../../src//types/auth";
import "../../../../custom-matchers"

describe('tests verifyRecovery method', () => {
  it('should throw a 400 error for non valid token', async () => {
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
      body: {
      },
      params: {
        token: 'test',
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, 'status');
    jest.spyOn(res, 'send');
    await authController.verifyRecovery(req, res);

    expect(mockedDb.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    const mockFindTokensCall = mockedDb.objects.Token.findTokens.mock.calls[0];
    expect(mockFindTokensCall[0]).toBeArrayWithElements(['token', 'type']);
    expect(mockFindTokensCall[1]).toBeArrayWithElements([req.params.token, SessionTokenType.Password]);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ message: 'Something went wrong on our end. Please try again.' });
  });

  it('should throw a 400 error for expired token', async () => {
    const mockedSmtpService = smtpService();
    const currentDate = new Date();
    const tokenDate = new Date();
    tokenDate.setMinutes(currentDate.getMinutes() - 31);
    const mockedToken = mockToken(
      {
        findTokens: jest.fn(() => ({
          rows: [{
            created_at: tokenDate,
            token: 'test',
            type: SessionTokenType.Password,
            user_id: 1,
          }]
        }))
      }
    )
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
      body: {
      },
      params: {
        token: 'test',
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, 'status');
    jest.spyOn(res, 'send');
    jest.spyOn(tokenHandler, 'isPasswordTokenExpired');
    await authController.verifyRecovery(req, res);

    expect(tokenHandler.isPasswordTokenExpired).toHaveBeenCalledTimes(1);
    const mockPasswordTokenExpiredCall = (tokenHandler.isPasswordTokenExpired as any).mock.calls[0];
    expect(mockPasswordTokenExpiredCall[0]).toStrictEqual(
      {
        created_at: tokenDate,
        token: 'test',
        type: SessionTokenType.Password,
        user_id: 1,
      }
    );

    expect(mockedDb.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    const mockFindTokensCall = mockedDb.objects.Token.findTokens.mock.calls[0];
    expect(mockFindTokensCall[0]).toBeArrayWithElements(['token', 'type']);
    expect(mockFindTokensCall[1]).toBeArrayWithElements([req.params.token, SessionTokenType.Password]);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ message: 'Something went wrong on our end. Please try again.' });
  });

  it('should redirect to /recover/test', async () => {
    const mockedSmtpService = smtpService();
    const currentDate = new Date();
    const mockedToken = mockToken(
      {
        findTokens: jest.fn(() => ({
          rows: [{
            created_at: currentDate,
            token: 'test',
            type: SessionTokenType.Password,
            user_id: 1,
          }]
        }))
      }
    )
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
      body: {
      },
      params: {
        token: 'test',
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, 'redirect');
    jest.spyOn(tokenHandler, 'isPasswordTokenExpired');
    await authController.verifyRecovery(req, res);

    expect(tokenHandler.isPasswordTokenExpired).toHaveBeenCalledTimes(1);
    const mockPasswordTokenExpiredCall = (tokenHandler.isPasswordTokenExpired as any).mock.calls[0];
    expect(mockPasswordTokenExpiredCall[0]).toStrictEqual(
      {
        created_at: currentDate,
        token: 'test',
        type: SessionTokenType.Password,
        user_id: 1,
      }
    );

    expect(mockedDb.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    const mockFindTokensCall = mockedDb.objects.Token.findTokens.mock.calls[0];
    expect(mockFindTokensCall[0]).toBeArrayWithElements(['token', 'type']);
    expect(mockFindTokensCall[1]).toBeArrayWithElements([req.params.token, SessionTokenType.Password]);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    const mockRedirectCall = (res.redirect as any).mock.calls[0];
    expect(mockRedirectCall[0]).toBe('/recover/test');
  });
});
