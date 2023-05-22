import bcrypt from "bcrypt";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { Role } from "@typings/auth";
import constructBottle from "@bottle";
import * as mockConstants from "@tests/constants";
import UserRepository from "@db/repositories/user";
import User from "@db/models/user";

jest.mock("pg");

describe("tests updateUser method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should update the user profile once with username, email, name, and password", async () => {
    const bottle = constructBottle(mockConstants.TEST_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST",
        email: "TEST",
        name: "TEST",
        password: "TEST",
        roleId: Role.Admin
      },
      params: {
        id: "TEST",
      },
      role: Role.User,
      userId: "TEST"
    });
    const { res } = getMockRes();
    const mockUser = new User({
      userId: "FOO", 
      verified: true, 
      roleId: Role.User, 
      username: "FOO",
      password: "FOO",
      email: "FOO",
      name: "FOO"
    });

    jest.spyOn(UserRepository.prototype, "getByUUID").mockResolvedValue(mockUser);
    jest.spyOn(UserRepository.prototype, "update");

    await bottle.container.UserController.updateUser(req, res);

    const updatedPassword = (
      (UserRepository.prototype.update as jest.Mock).mock.calls[0][0] as User
    ).password;
    const updatedUser = new User({
      ...mockUser,
      userId: mockUser.userId,
      username: req.body.username,
      email: req.body.email,
      password: updatedPassword,
      name: req.body.name
    });
    expect(bcrypt.compareSync(
      req.body.password,
      updatedPassword,
    )).toBeTruthy();

    expect(UserRepository.prototype.update).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.update).toHaveBeenCalledWith(updatedUser);
  });

  test("should update the user profile once with username, email, name, password, and roleId", async () => {
    const bottle = constructBottle(mockConstants.TEST_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST",
        email: "TEST",
        name: "TEST",
        password: "TEST",
        roleId: Role.Admin
      },
      params: {
        id: "TEST",
      },
      role: Role.Admin,
      userId: "TEST"
    });
    const { res } = getMockRes();
    const mockUser = new User({
      userId: "FOO", 
      verified: true, 
      roleId: Role.User, 
      username: "FOO",
      password: "FOO",
      email: "FOO",
      name: "FOO"
    });

    jest.spyOn(UserRepository.prototype, "getByUUID").mockResolvedValue(mockUser);
    jest.spyOn(UserRepository.prototype, "update");

    await bottle.container.UserController.updateUser(req, res);

    const updatedPassword = (
      (UserRepository.prototype.update as jest.Mock).mock.calls[0][0] as User
    ).password;
    const updatedUser = new User({
      ...mockUser,
      userId: mockUser.userId,
      username: req.body.username,
      email: req.body.email,
      password: updatedPassword,
      name: req.body.name,
      roleId: Role.Admin
    });
    expect(bcrypt.compareSync(
      req.body.password,
      updatedPassword,
    )).toBeTruthy();

    expect(UserRepository.prototype.update).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.update).toHaveBeenCalledWith(updatedUser);
  });
});
