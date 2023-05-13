import bcrypt from "bcrypt";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { Role, SessionTokenType } from "@typings/auth";
import dependencyInjection from "@di";
import * as mockConstants from "@tests/constants";

jest.mock("pg");
jest.mock("nodemailer");

describe("tests signup method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test("should throw a 400 error due to body not including name", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST",
        email: "TEST",
        password: "TEST"
      },
    });
    const { res } = getMockRes();
    
    await dependencyContainer.AuthController.signup(req, res);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({
      message: "Body must include username, email, password, and name"
    });
  });

  test("should create a new user and send a verification email", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST",
        email: "TEST",
        password: "TEST",
        name: "TEST"
      },
    });
    const { res } = getMockRes();
    const mockUser = {
      user_id: "TEST", 
      verified: true, 
      role_id: Role.Admin, 
      username: req.body.username,
      password: await bcrypt.hash(req.body.password, 10),
      email: req.body.email,
      name: req.body.name
    };
    const mockPGPoolClient = await dependencyContainer.DB.pool.connect();

    jest.spyOn(dependencyContainer.AuthController, "sendVerificationEmail");
    jest.spyOn(dependencyContainer.DB.pool, "connect").mockImplementation(() => mockPGPoolClient);
    jest.spyOn(dependencyContainer.DB.objects.User, "create").mockResolvedValue({
      rows: [mockUser],
      command: "",
      oid: 0,
      rowCount: 1,
      fields: []
    });
    jest.spyOn(dependencyContainer.DB.objects.Token, "create");

    await dependencyContainer.AuthController.signup(req, res);

    expect(dependencyContainer.AuthController.sendVerificationEmail).toHaveBeenCalledTimes(1);
    const verificationEmailCall = (dependencyContainer.AuthController.sendVerificationEmail as jest.Mock).mock.calls[0];
    expect(verificationEmailCall[0]).toStrictEqual(req);
    expect(verificationEmailCall[1]).toStrictEqual(mockUser);
    const verificationToken = verificationEmailCall[2];

    expect(dependencyContainer.DB.objects.User.create).toHaveBeenCalledTimes(1);
    const createUserCall = (dependencyContainer.DB.objects.User.create as jest.Mock).mock.calls[0];
    expect(createUserCall[0]).toBe(req.body.username);
    expect(createUserCall[1]).toBe(req.body.email);
    expect(createUserCall[3]).toBe(Role.User);
    expect(createUserCall[4]).toBe(req.body.name);
    expect(createUserCall[5]).toBe(mockPGPoolClient);
    expect(bcrypt.compareSync(
      req.body.password,
      createUserCall[2],
    )).toBeTruthy();

    expect(dependencyContainer.DB.objects.Token.create).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.Token.create).toHaveBeenCalledWith(
      mockUser.user_id,
      verificationToken,
      SessionTokenType.Verification,
      mockPGPoolClient
    );

    expect(mockPGPoolClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockPGPoolClient.query).toHaveBeenLastCalledWith("COMMIT");
    expect(mockPGPoolClient.release).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledTimes(1);
  });
});
