import bcrypt from "bcrypt";
import { getMockReq, getMockRes } from "@jest-mock/express";
import constructBottle from "@bottle";
import * as mockConstants from "@tests/constants";
import UserRepository from "@db/repositories/user";
import User from "@db/models/user";
import TokenRepository from "@db/repositories/token";
import SMTPClient from "@smtp-client";

jest.mock("pg");

describe("tests signup method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test("should throw a 400 error due to body not including name", async () => {
    const bottle = constructBottle(mockConstants.TEST_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST",
        email: "TEST",
        password: "TEST"
      },
    });
    const { res } = getMockRes();
    
    await bottle.container.AuthController.signup(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      message: "Body must include username, email, password, and name"
    });
  });

  test("should create a new user and send a verification email", async () => {
    const bottle = constructBottle(mockConstants.TEST_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST",
        email: "TEST",
        password: "TEST",
        name: "TEST"
      },
    });
    const { res } = getMockRes();

    const mockPGPoolClient = await bottle.container.DBClient.connectionPool.connect();

    jest.spyOn(SMTPClient.prototype, "sendEmail");
    jest.spyOn(bottle.container.DBClient.connectionPool, "connect").mockImplementation(() => mockPGPoolClient);
    jest.spyOn(UserRepository.prototype, "create").mockResolvedValue();
    jest.spyOn(TokenRepository.prototype, "create").mockResolvedValue();

    await bottle.container.AuthController.signup(req, res);

    const newUser = (
      (UserRepository.prototype.create as jest.Mock).mock.calls[0][0] as User
    );
    expect(newUser).toStrictEqual(
      new User({
        ...newUser,
        userId: newUser.userId,
        username: req.body.username,
        email: req.body.email,
        name: req.body.name,
      })
    );
    expect(bcrypt.compareSync(
      req.body.password,
      newUser.password,
    )).toBeTruthy();

    expect(SMTPClient.prototype.sendEmail).toHaveBeenCalledTimes(1);

    expect(UserRepository.prototype.create).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.create).toHaveBeenCalledWith(newUser);

    expect(TokenRepository.prototype.create).toHaveBeenCalledTimes(1);

    expect(mockPGPoolClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockPGPoolClient.query).toHaveBeenLastCalledWith("COMMIT");
    expect(mockPGPoolClient.release).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
