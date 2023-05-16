import { getMockReq, getMockRes } from "@jest-mock/express";
import { Role, SessionTokenType } from "@typings/auth";
import constructBottle from "@bottle";
import * as mockConstants from "@tests/constants";
import UserRepository from "@db/repositories/user-repository";
import User from "@db/models/user";

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
    });
    const { res } = getMockRes();

    jest.spyOn(bottle.container.DBClient.objects.Token, "findTokens").mockResolvedValue({
      rows: [],
      command: "",
      oid: 0,
      rowCount: 0,
      fields: []
    });

    await bottle.container.AuthController.verify(req, res);

    expect(bottle.container.DBClient.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.Token.findTokens).toHaveBeenCalledWith({
      "token": req.params.token,
      "type": SessionTokenType.Verification
    });

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
    const mockToken = {
      created_at: new Date(),
      token: "TEST",
      type: SessionTokenType.Verification,
      user_id: "TEST",
    };
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
    jest.spyOn(bottle.container.DBClient.objects.Token, "deleteToken");
    jest.spyOn(bottle.container.DBClient.objects.Token, "findTokens").mockResolvedValue({
      rows: [mockToken],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });
    jest.spyOn(UserRepository.prototype, "getByUUID").mockResolvedValue(mockUser);

    await bottle.container.AuthController.verify(req, res);

    const updatedUser = new User({
      ...mockUser,
      verified: true,
    });

    expect(bottle.container.DBClient.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.Token.findTokens).toHaveBeenCalledWith({
      "token": req.params.token,
      "type": SessionTokenType.Verification
    });

    expect(UserRepository.prototype.getByUUID).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.getByUUID).toHaveBeenCalledWith(mockToken.user_id);
    
    expect(UserRepository.prototype.update).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.update).toHaveBeenCalledWith(updatedUser);

    expect(bottle.container.DBClient.objects.Token.deleteToken).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.Token.deleteToken).toHaveBeenCalledWith(
      req.params.token
    );

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/login");
  });
});
