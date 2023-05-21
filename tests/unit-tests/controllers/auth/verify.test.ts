import { getMockReq, getMockRes } from "@jest-mock/express";
import { OneTimeTokenType, Role } from "@typings/auth";
import constructBottle from "@bottle";
import * as mockConstants from "@tests/constants";
import UserRepository from "@db/repositories/user-repository";
import User from "@db/models/user";
import TokenRepository from "@db/repositories/token-repository";
import Token from "@db/models/token";

jest.mock("pg");

describe("tests verify method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should redirect to /login for invalid verify token", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      params: {
        token: "TEST",
      },
      query: {
        userId: "FOO"
      }
    });
    const { res } = getMockRes();

    jest.spyOn(TokenRepository.prototype, "getByUserIdAndType").mockResolvedValue(null);

    await bottle.container.AuthController.verify(req, res);

    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledTimes(1);
    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledWith(
      req.query.userId,
      OneTimeTokenType.Verification
    );

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/login");
  });

  test("should set user as verified, remove token, and redirect to /login", async () => {
    const bottle = constructBottle(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      params: {
        token: "TEST",
      },
    });
    const { res } = getMockRes();
    const mockToken = new Token({
      createdAt: new Date(),
      token: "TEST",
      type: OneTimeTokenType.Verification,
      userId: "TEST",
    });
    const mockUser = new User({
      userId: "TEST", 
      verified: false ,
      roleId: Role.Admin, 
      username: "TEST",
      password: "TEST",
      email: "TEST",
      name: "TEST"
    });

    jest.spyOn(UserRepository.prototype, "update");
    jest.spyOn(TokenRepository.prototype, "delete");
    jest.spyOn(TokenRepository.prototype, "getByUserIdAndType").mockResolvedValue(mockToken);
    jest.spyOn(UserRepository.prototype, "getByUUID").mockResolvedValue(mockUser);

    await bottle.container.AuthController.verify(req, res);

    const updatedUser = new User({
      ...mockUser,
      userId: mockUser.userId,
      verified: true,
    });

    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledTimes(1);
    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledWith(
      req.query.userId,
      OneTimeTokenType.Verification
    );

    expect(UserRepository.prototype.getByUUID).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.getByUUID).toHaveBeenCalledWith(mockToken.userId);
    
    expect(UserRepository.prototype.update).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.update).toHaveBeenCalledWith(updatedUser);

    expect(TokenRepository.prototype.delete).toHaveBeenCalledTimes(1);
    expect(TokenRepository.prototype.delete).toHaveBeenCalledWith(mockToken);

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/login");
  });
});
