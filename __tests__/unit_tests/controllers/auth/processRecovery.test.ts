import request from "../../../../__mocks__/request";
import response from "../../../../__mocks__/response";
import mockDB from "../../../../__mocks__/db";
import DB from "../../../../src/db";
import logger from "../../../../__mocks__/logger";
import AuthController from "../../../../src/controllers/auth.controller";
import TokenHandler from "../../../../src/support/tokenhandler.support";
import mockUser from "../../../../__mocks__/user";
import mockToken from "../../../../__mocks__/token";
import smtpService from "../../../../__mocks__/smtpService";
import { Logger } from "winston";
import SmtpService from "../../../../src/services/smtp.service";
import { Request, Response } from "express";
import { Role, SessionTokenType } from "../../../../src/types/auth";
import bcrypt from "bcrypt";
import jwtDecode from "jwt-decode";
import "../../../../custom-matchers"
import CookieConfig from "../../../../src/config/cookie";


describe('tests processRecovery method', () => {
  it('should throw a 400 error for non valid body', async () => {
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
      params: {
        token: 'test',
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, 'status');
    jest.spyOn(res, 'json');
    await authController.processRecovery(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ message: 'Body must include password' });
  });

  it('should throw a 400 error for non valid token', async () => {
    const mockedSmtpService = smtpService();
    const mockedToken = mockToken(
      {
        findTokens: jest.fn(() => ({
          rows: []
        }))
      }
    );
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
        password: 'test',
      },
      params: {
        token: 'test',
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, 'status');
    jest.spyOn(res, 'send');
    await authController.processRecovery(req, res);

    expect(mockedDb.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    const mockFindUsersCall = mockedDb.objects.Token.findTokens.mock.calls[0];
    expect(mockFindUsersCall[0]).toBeArrayWithElements(['token', 'type']);
    expect(mockFindUsersCall[1]).toBeArrayWithElements([req.params.token, SessionTokenType.Password]);

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
    const tokenHandler = new TokenHandler("test") as any;

    const authController = new AuthController(
      mockedSmtpService as unknown as SmtpService, 
      tokenHandler,
      mockedDb as unknown as DB, 
      mockedLogger as unknown as Logger
    );

    const req = request({
      body: {
        password: 'test',
      },
      params: {
        token: 'test',
      },
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, 'status');
    jest.spyOn(res, 'send');
    jest.spyOn(tokenHandler, 'isPasswordTokenExpired');
    await authController.processRecovery(req, res);

    expect(tokenHandler.isPasswordTokenExpired).toHaveBeenCalledTimes(1);
    const mockPasswordTokenExpiredCall = tokenHandler.isPasswordTokenExpired.mock.calls[0];
    expect(mockPasswordTokenExpiredCall[0]).toStrictEqual({
      created_at: tokenDate,
      token: 'test',
      type: SessionTokenType.Password,
      user_id: 1,
    });

    expect(mockedDb.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    const mockFindUsersCall = mockedDb.objects.Token.findTokens.mock.calls[0];
    expect(mockFindUsersCall[0]).toBeArrayWithElements(['token', 'type']);
    expect(mockFindUsersCall[1]).toBeArrayWithElements([req.params.token, SessionTokenType.Password]);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ message: 'Something went wrong on our end. Please try again.' });
  });

  it('should successfully update password and return token and cookie', async () => {
    const currentDate = new Date();
    const mockedSmtpService = smtpService();
    const mockedUser = mockUser(
      {
        findUsers: jest.fn(() => ({
          rows: [{
            user_id: 1, verified: true, role_id: Role.Admin, username: 'test',
          }],
        })),
      }
    );
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
    const mockedDb = mockDB(mockedUser, mockedToken);
    const mockedLogger = logger();
    const tokenHandler = new TokenHandler("test") as any;

    const authController = new AuthController(
      mockedSmtpService as unknown as SmtpService, 
      tokenHandler,
      mockedDb as unknown as DB, 
      mockedLogger as unknown as Logger
    );

    const req = request({
      body: {
        password: 'test',
      },
      params: {
        token: 'test',
      },
    }) as unknown as Request;

    const res = response() as any;
    jest.spyOn(res, 'cookie');
    jest.spyOn(res, 'send');
    jest.spyOn(tokenHandler, 'isPasswordTokenExpired');
    jest.spyOn(Date, 'now').mockImplementation(() => currentDate.valueOf());
    await authController.processRecovery(req, res);

    expect(mockedDb.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    const mockedFindTokensCall = mockedDb.objects.Token.findTokens.mock.calls[0];
    expect(mockedFindTokensCall[0]).toBeArrayWithElements(['token', 'type']);
    expect(mockedFindTokensCall[1]).toBeArrayWithElements([req.params.token, SessionTokenType.Password])

    expect(tokenHandler.isPasswordTokenExpired).toHaveBeenCalledTimes(1);
    const mockPasswordTokenExpiredCall = tokenHandler.isPasswordTokenExpired.mock.calls[0];
    expect(mockPasswordTokenExpiredCall[0]).toStrictEqual({
      created_at: currentDate,
      token: 'test',
      type: SessionTokenType.Password,
      user_id: 1,
    });

    expect(mockedDb.objects.User.findUsers).toHaveBeenCalledTimes(1);
    const mockFindUsersCall = mockedDb.objects.User.findUsers.mock.calls[0];
    expect(mockFindUsersCall[0]).toBeArrayWithElements(['user_id']);
    expect(mockFindUsersCall[1]).toBeArrayWithElements([1]);

    expect(mockedDb.objects.User.setAttributes).toHaveBeenCalledTimes(1);
    const mockSetAttributesCall = mockedDb.objects.User.setAttributes.mock.calls[0];
    expect(mockSetAttributesCall[0]).toBeArrayWithElements(['password']);
    expect(bcrypt.compareSync(
      'test',
      mockSetAttributesCall[1][0],
    ));
    expect(mockSetAttributesCall[2]).toBe(1);

    expect(mockedDb.objects.Token.deleteToken).toHaveBeenCalledTimes(1);
    expect(mockedDb.objects.Token.deleteToken.mock.calls[0][0]).toBe(req.params.token)

    expect(res.cookie).toBeCalledTimes(1);
    const mockCookieCall = res.cookie.mock.calls[0];
    expect(mockCookieCall[0]).toBe(CookieConfig.cookieName);
    expect(jwtDecode(mockCookieCall[1])).toMatchObject({
      id: 1,
      role: Role.Admin,
      verified: true,
      username: 'test',
    });
    expect(mockCookieCall[2]).toStrictEqual(CookieConfig.generateCookieOptions(currentDate.valueOf()));

    expect(res.send).toBeCalledTimes(1);
    const mockSendCall = res.send.mock.calls[0];
    expect(jwtDecode(mockSendCall[0].token)).toMatchObject({
      id: 1,
      role: Role.Admin,
      verified: true,
      username: 'test',
    });
  });
});
