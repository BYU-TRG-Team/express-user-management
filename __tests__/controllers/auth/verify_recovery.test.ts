import { getMockReq, getMockRes } from "@jest-mock/express";
import { SessionTokenType } from "types/auth";
import dependencyInjection from "di/index";
import * as mockConstants from "tests/constants";

jest.mock("pg");

describe("tests verifyRecovery method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it("should throw a 400 error for non valid token", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      params: {
        token: mockConstants.MOCK_TOKEN,
      },
    });
    const { res } = getMockRes();

    jest.spyOn(dependencyContainer.DB.objects.Token, "findTokens").mockResolvedValue({
      rows: [],
      command: "",
      oid: 0,
      rowCount: 0,
      fields: []
    });
    
    await dependencyContainer.AuthController.verifyRecovery(req, res);

    expect(dependencyContainer.DB.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.Token.findTokens).toHaveBeenCalledWith({
      "token": req.params.token,
      "type": SessionTokenType.Password
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: "Something went wrong on our end. Please try again." 
    });
  });

  it("should throw a 400 error for expired token", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      params: {
        token: mockConstants.MOCK_TOKEN,
      },
    });
    const { res } = getMockRes();
    const mockToken = {
      created_at: new Date(Date.now() - 1800001), // Password reset token is considered expired after 30 minutes
      token: mockConstants.MOCK_TOKEN,
      type: SessionTokenType.Password,
      user_id: mockConstants.MOCK_UUID,
    };

    jest.spyOn(dependencyContainer.DB.objects.Token, "findTokens").mockResolvedValue({
      rows: [mockToken],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });

    await dependencyContainer.AuthController.verifyRecovery(req, res);

    expect(dependencyContainer.DB.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.Token.findTokens).toHaveBeenCalledWith({
      "token": req.params.token,
      "type": SessionTokenType.Password
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ 
      message: "Something went wrong on our end. Please try again." 
    });
  });

  it("should redirect to /recover/test", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      params: {
        token: mockConstants.MOCK_TOKEN,
      },
    });
    const { res } = getMockRes();
    const mockToken = {
      created_at: new Date(),
      token: mockConstants.MOCK_TOKEN,
      type: SessionTokenType.Password,
      user_id: mockConstants.MOCK_UUID,
    };

    jest.spyOn(dependencyContainer.DB.objects.Token, "findTokens").mockResolvedValue({
      rows: [mockToken],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });

    await dependencyContainer.AuthController.verifyRecovery(req, res);

    expect(dependencyContainer.DB.objects.Token.findTokens).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.Token.findTokens).toHaveBeenCalledWith({
      "token": req.params.token,
      "type": SessionTokenType.Password
    });

    expect(res.redirect).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(`/recover/${req.params.token}`);
  });
});
