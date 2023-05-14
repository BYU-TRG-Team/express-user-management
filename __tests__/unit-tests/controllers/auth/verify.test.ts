import { getMockReq, getMockRes } from "@jest-mock/express";
import { Role, SessionTokenType } from "@typings/auth";
import constructBottle from "@bottle";
import * as mockConstants from "@tests/constants";

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
    const mockUser = {
      user_id: "TEST", 
      verified: false ,
      role_id: Role.Admin, 
      username: "TEST",
      password: "TEST",
      email: "TEST",
      name: "TEST"
    };

    jest.spyOn(bottle.container.DBClient.objects.User, "setAttributes");
    jest.spyOn(bottle.container.DBClient.objects.Token, "deleteToken");
    jest.spyOn(bottle.container.DBClient.objects.Token, "findTokens").mockResolvedValue({
      rows: [mockToken],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });
    jest.spyOn(bottle.container.DBClient.objects.User, "findUsers").mockResolvedValue({
      rows: [mockUser],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });

    await bottle.container.AuthController.verify(req, res);

    expect(bottle.container.DBClient.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.Token.findTokens).toHaveBeenCalledWith({
      "token": req.params.token,
      "type": SessionTokenType.Verification
    });

    expect(bottle.container.DBClient.objects.User.findUsers).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.User.findUsers).toHaveBeenCalledWith({
      "user_id": mockToken.user_id
    });
    
    expect(bottle.container.DBClient.objects.User.setAttributes).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.User.setAttributes).toHaveBeenCalledWith(
      mockToken.user_id,
      {
        "verified": true,
      }
    );

    expect(bottle.container.DBClient.objects.Token.deleteToken).toHaveBeenCalledTimes(1);
    expect(bottle.container.DBClient.objects.Token.deleteToken).toHaveBeenCalledWith(
      req.params.token
    );

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith("/login");
  });
});
