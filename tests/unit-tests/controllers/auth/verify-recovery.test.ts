import { getMockReq, getMockRes } from "@jest-mock/express";
import { OneTimeTokenType } from "@typings/auth";
import constructBottle from "@bottle";
import * as mockConstants from "@tests/constants";
import TokenRepository from "@db/repositories/token-repository";
import Token from "@db/models/token";

jest.mock("pg");

describe("tests verifyRecovery method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test("should throw a 400 error for non valid token", async () => {
    const bottle = constructBottle(mockConstants.TEST_INIT_OPTIONS);
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
    
    await bottle.container.AuthController.verifyRecovery(req, res);

    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledTimes(1);
    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledWith(
      req.query.userId,
      OneTimeTokenType.Password
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: "Something went wrong on our end. Please try again." 
    });
  });

  test("should throw a 400 error for expired token", async () => {
    const bottle = constructBottle(mockConstants.TEST_INIT_OPTIONS);
    const req = getMockReq({
      params: {
        token: "TEST",
      },
      query: {
        userId: "FOO"
      }
    });
    const { res } = getMockRes();
    const mockToken = new Token({
      createdAt: new Date(Date.now() - 1800001), // Password reset token is considered expired after 30 minutes
      token: "TEST",
      type: OneTimeTokenType.Password,
      userId: "TEST",
    });

    jest.spyOn(TokenRepository.prototype, "getByUserIdAndType").mockResolvedValue(mockToken);

    await bottle.container.AuthController.verifyRecovery(req, res);

    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledTimes(1);
    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledWith(
      req.query.userId,
      OneTimeTokenType.Password
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: "Something went wrong on our end. Please try again." 
    });
  });

  test("should redirect to /recover/test", async () => {
    const bottle = constructBottle(mockConstants.TEST_INIT_OPTIONS);
    const req = getMockReq({
      params: {
        token: "TEST",
      },
      query: {
        userId: "FOO"
      }
    });
    const { res } = getMockRes();
    const mockToken = new Token({
      createdAt: new Date(),
      token: "TEST",
      type: OneTimeTokenType.Password,
      userId: "TEST",
    });

    jest.spyOn(TokenRepository.prototype, "getByUserIdAndType").mockResolvedValue(mockToken);

    await bottle.container.AuthController.verifyRecovery(req, res);

    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledTimes(1);
    expect(TokenRepository.prototype.getByUserIdAndType).toHaveBeenCalledWith(
      req.query.userId,
      OneTimeTokenType.Password
    );

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(`/recover/${req.params.token}?userId=${req.query.userId}`);
  });
});
