import request from "../../../../__mocks__/request";
import response from "../../../../__mocks__/response";
import mockDB from "../../../../__mocks__/db";
import DB from "../../../../src/db";
import logger from "../../../../__mocks__/logger";
import UserController from "../../../../src/controllers/user.controller";
import "../../../../custom-matchers";
import TokenHandler from "../../../../src/support/tokenhandler.support";
import mockUser from "../../../../__mocks__/user";
import mockToken from "../../../../__mocks__/token";
import { Logger } from "winston";
import { Request, Response } from "express";
import { Role } from "../../../../src/types/auth";

describe("tests updateUser method", () => {
  it("should update the user profile once with username, email, name, and password", async () => {
    const mockedLogger = logger() as unknown as Logger; 
    const mockedDb = mockDB(mockUser(), mockToken());

    const userController = new UserController(
      new TokenHandler("test"),
      mockedLogger,
      mockedDb as unknown as DB
    );

    const req = request({
      body: {
        username: "test",
        email: "test@test.com",
        name: "Test",
        password: "test",
        roleId: Role.User,
        testAttr: "test",
      },
      params: {
        id: 10,
      },
      role: Role.User,
    }) as unknown as Request;

    const res = response() as unknown as Response;
    await userController.updateUser(req, res);

    expect(mockedDb.objects.User.setAttributes).toHaveBeenCalledTimes(1);
    const firstCall = mockedDb.objects.User.setAttributes.mock.calls[0];
    expect(firstCall[0]).toBeArrayWithElements(["username", "email", "name", "password"]);
    firstCall[0].forEach((attr: string, index: number) => {
      if (attr !== "password") {
        expect(firstCall[1][index]).toBe(req.body[attr]);
      }
    });
    expect(firstCall[2]).toBe(10);
  });

  it("should update the user profile once with username, email, name, and password, and then a second time with roleId", async () => {
    const mockedLogger = logger() as unknown as Logger; 
    const mockedDb = mockDB(mockUser(), mockToken());

    const userController = new UserController(
      new TokenHandler("test"),
      mockedLogger,
      mockedDb as unknown as DB
    );

    const req = request({
      body: {
        username: "test",
        email: "test@test.com",
        name: "Test",
        password: "test",
        roleId: Role.User,
        testAttr: "test",
      },
      params: {
        id: 10,
      },
      role: Role.Admin,
    }) as unknown as Request;

    const res = response() as unknown as Response;
    await userController.updateUser(req, res);

    expect(mockedDb.objects.User.setAttributes).toHaveBeenCalledTimes(2);
    const firstCall = mockedDb.objects.User.setAttributes.mock.calls[0];
    expect(firstCall[0]).toBeArrayWithElements(["username", "email", "name", "password"]);
    firstCall[0].forEach((attr: string, index: number) => {
      if (attr !== "password") {
        expect(firstCall[1][index]).toBe(req.body[attr]);
      }
    });
    expect(firstCall[2]).toBe(10);

    const secondCall = mockedDb.objects.User.setAttributes.mock.calls[1];
    expect(secondCall[0]).toBeArrayWithElements(["role_id"]);
    secondCall[0].forEach((attr: string, index: number) => {
      if (attr === "role_id") {
        expect(secondCall[1][index]).toBe(req.body.roleId);
        return;
      }

      expect(secondCall[1][index]).toBe(req.body[attr]);
    });
    expect(secondCall[2]).toBe(10);
  });

  it("should update the user profile once with roleId", async () => {
    const mockedLogger = logger() as unknown as Logger; 
    const mockedDb = mockDB(mockUser(), mockToken());

    const userController = new UserController(
      new TokenHandler("test"),
      mockedLogger,
      mockedDb as unknown as DB
    );

    const req = request({
      body: {
        roleId: "1",
      },
      params: {
        id: 10,
      },
      role: Role.Admin,
    }) as unknown as Request;

    const res = response() as unknown as Response;
    await userController.updateUser(req, res);

    expect(mockedDb.objects.User.setAttributes).toHaveBeenCalledTimes(1);
    const firstCall = mockedDb.objects.User.setAttributes.mock.calls[0];
    expect(firstCall[0]).toBeArrayWithElements(["role_id"]);
    firstCall[0].forEach((attr: string, index: number) => {
      if (attr === "role_id") {
        expect(firstCall[1][index]).toBe(req.body.roleId);
        return;
      }

      expect(firstCall[1][index]).toBe(req.body[attr]);
    });
    expect(firstCall[2]).toBe(10);
  });
});
