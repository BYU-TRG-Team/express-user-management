import { resetTestDb } from "@tests/helpers/db";
import TokenRepository from "@db/repositories/token";
import SignUpController from "@controllers/auth/sign-up";
import { constructTestBottle } from "@tests/helpers/library";
import { getMockReq, getMockRes } from "@jest-mock/express";
import UserRepository from "@db/repositories/user";
import SMTPClient from "@smtp-client";
import { generateTestUser } from "@tests/helpers/user";
import { faker } from "@faker-js/faker";
import { Pool } from "pg";
import { SignUpRequest } from "@typings/api";

jest.unmock("pg");

let testDbClient: Pool;
let signUpController: SignUpController;
let userRepository: UserRepository;
let tokenRepository: TokenRepository;

describe("tests SignUpController", () => {
  beforeAll(async () => {
    const testBottle = constructTestBottle();
    testDbClient = testBottle.container.DBClientPool.connectionPool;
    signUpController = testBottle.container.SignUpController;
    userRepository = new UserRepository(testDbClient);
    tokenRepository = new TokenRepository(testDbClient);
  });

  afterEach(async () => {
    await resetTestDb(testDbClient);
    jest.restoreAllMocks();
  });

  afterAll(() => {
    testDbClient.end();
  });

  test("should create a new user, a verification token, and send a verification email", async () => {
    jest.spyOn(SMTPClient.prototype, "sendEmail");
    
    const { res } = getMockRes();
    const req = getMockReq<SignUpRequest>({
      body: {
        username: faker.internet.userName(),
        name:  faker.internet.displayName(),
        email: faker.internet.email(),
        password: faker.internet.password()
      },
    });

    // Invoke handler
    await signUpController.handle(req, res);
    
    const users = await userRepository.getAll();
    expect(users.length).toStrictEqual(1);
  
    const tokens = await tokenRepository.getAll();
    expect(tokens.length).toStrictEqual(1);
    
    expect(SMTPClient.prototype.sendEmail).toHaveBeenCalledTimes(1);
  });

  test("should not create a new user, a verification token, nor send a verification email", async () => {
    jest.spyOn(SMTPClient.prototype, "sendEmail");

    const [ newUser, saveToDb ] = await generateTestUser();
    await saveToDb(testDbClient);

    const { res } = getMockRes();
    const req = getMockReq<SignUpRequest>({
      body: {
        username: faker.internet.userName(),
        name:  faker.internet.displayName(),
        email: newUser.email,
        password: faker.internet.password()
      },
    });

    // Invoke handler
    await signUpController.handle(req, res);

    const users = await userRepository.getAll();
    expect(users.length).toStrictEqual(1);

    const tokens = await tokenRepository.getAll();
    expect(tokens.length).toStrictEqual(0);

    expect(SMTPClient.prototype.sendEmail).toHaveBeenCalledTimes(0);
  });
});