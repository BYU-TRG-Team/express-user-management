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
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import authConfig from "../../../../src/config/auth";
import jwtDecode from "jwt-decode";
import { Role } from "../../../../src/types/auth";
import jwt from "jsonwebtoken";

describe('tests signin method', () => {
  it('should throw a 400 error for invalid body', async () => {
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
        username: 'test',
      },
      role: 'user',
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, 'status');
    jest.spyOn(res, 'send');
    await authController.signin(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ message: 'Body must include a username and password' });
  });

  it('should throw a 400 error for no found user', async () => {
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
        username: 'test',
        password: 'test',
      },
      role: 'user',
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, 'status');
    jest.spyOn(res, 'send');
    await authController.signin(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);

    expect(mockedDb.objects.User.findUsers).toHaveBeenCalledTimes(1);
    const findUsersCall = mockedDb.objects.User.findUsers.mock.calls[0];
    expect(findUsersCall[0]).toStrictEqual(['username']);
    expect(findUsersCall[1]).toStrictEqual([req.body.username]);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ message: 'Username or password is incorrect. Please try again.' });
  });

  it('should throw a 400 error for invalid password', async () => {
    const hashedPassword = await bcrypt.hash('tes', 10);
    const mockedSmtpService = smtpService();
    const mockedUser = mockUser({
      findUsers: jest.fn(() => ({
        rows: [{
          password: hashedPassword
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
        username: 'test',
        password: 'test',
      },
      role: 'user',
    }) as unknown as Request;

    const res = response() as unknown as Response;
    jest.spyOn(res, 'status');
    jest.spyOn(res, 'send');
    await authController.signin(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);

    expect(mockedDb.objects.User.findUsers).toHaveBeenCalledTimes(1);
    const findUsersCall = mockedDb.objects.User.findUsers.mock.calls[0];
    expect(findUsersCall[0]).toStrictEqual(['username']);
    expect(findUsersCall[1]).toStrictEqual([req.body.username]);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ message: 'Username or password is incorrect. Please try again.' });
  });

  it('should successfully create a jwt token', async () => {
    const hashedPassword = await bcrypt.hash('test', 10);
    const mockedSmtpService = smtpService();
    const mockedUser = mockUser({
      findUsers: jest.fn(() => ({
        rows: [{
          password: hashedPassword,
          email: 'test',
          user_id: 1,
          role_id: Role.Admin,
          name: 'test',
          verified: true,
          username: 'username'
        }]
      }))
    });
    const mockedDb = mockDB(mockedUser, mockToken());
    const mockedLogger = logger();
    const tokenHandler = new TokenHandler("test");
    const mockAuthToken = jwt.sign({
      id: 1,
      role: Role.Admin,
      verified: true,
      username: 'username',
    }, "test");

    const authController = new AuthController(
      mockedSmtpService as unknown as SmtpService, 
      tokenHandler,
      mockedDb as unknown as DB, 
      mockedLogger as unknown as Logger
    );

    const req = request({
      body: {
        username: 'test',
        password: 'test',
      },
      role: 'user',
    }) as unknown as Request;

    const res = response() as any;
    jest.spyOn(res, 'cookie');
    jest.spyOn(res, 'json');
    await authController.signin(req, res as unknown as Response);

    expect(res.cookie).toHaveBeenCalledTimes(1);
    const mockResCookieCall = res.cookie.mock.calls[0];
    expect(mockResCookieCall[0]).toBe(authConfig.cookieName);
    expect(jwtDecode(mockResCookieCall[1])).toMatchObject({
      id: 1,
      role: Role.Admin,
      verified: true,
      username: 'username',
    });
    expect(mockResCookieCall[2]).toMatchObject(authConfig.cookieConfig);

    expect(res.json).toHaveBeenCalledTimes(1);
    const mockJsonCall = res.json.mock.calls[0];
    expect(mockJsonCall[0]).toStrictEqual({
      token: mockAuthToken
    });
  });
});
