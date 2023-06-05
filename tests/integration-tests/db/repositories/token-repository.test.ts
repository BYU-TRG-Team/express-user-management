import { generateTestToken } from "@tests/helpers/token";
import { resetTestDb } from "@tests/helpers/db";
import TokenRepository from "@db/repositories/token";
import { generateOneTimeToken } from "@helpers/auth";
import { constructTestBottle } from "@tests/helpers/library";
import { Pool } from "pg";
import { generateTestUser } from "@tests/helpers/user";

jest.unmock("pg");

let testDbClient: Pool;
let tokenRepository: TokenRepository;

describe("tests TokenRepository", () => {
  beforeAll(async () => {
    const testBottle = constructTestBottle();
    testDbClient = testBottle.container.DBClientPool.connectionPool;
    tokenRepository = new TokenRepository(testDbClient);
  });

  afterEach(async () => {
    await resetTestDb(testDbClient);
    jest.restoreAllMocks();
  });

  afterAll(() => {
    testDbClient.end();
  });

  test("should be able to get all tokens", async () => {
    for (let i = 0; i < 50; ++i) {
      const [ newUser, saveUserToDb ] = await generateTestUser();
      await saveUserToDb(testDbClient);

      const [ _newToken, saveTokenToDb ] = await generateTestToken(newUser);
      await saveTokenToDb(testDbClient);
    }
  
    // Invoke getAll method
    const tokens = await tokenRepository.getAll();

    expect(tokens.length).toStrictEqual(50);
  });

  test("should be able to get a token given a userId and type", async () => {
    const [ newUser, saveUserToDb ] = await generateTestUser();
    await saveUserToDb(testDbClient);

    const [ newToken, saveTokenToDb ] = await generateTestToken(newUser);
    await saveTokenToDb(testDbClient);

    // Invoke getByUserIdAndType method
    const token = await tokenRepository.getByUserIdAndType(
      newToken.userId,
      newToken.type
    );
    
    expect(token).toStrictEqual(newToken);
  });

  test("should be able to create a token", async () => {
    const [ newUser, saveUserToDb ] = await generateTestUser();
    await saveUserToDb(testDbClient);

    const [ newToken ] = await generateTestToken(newUser);

    // Invoke create method
    await tokenRepository.create(newToken);

    const token = await tokenRepository.getByUserIdAndType(
      newToken.userId,
      newToken.type
    );

    expect(token).toStrictEqual(newToken);
  });

  test("should be able to update a token", async () => {
    const [ newUser, saveUserToDb ] = await generateTestUser();
    await saveUserToDb(testDbClient);

    const [ newToken, saveTokenToDb ] = await generateTestToken(newUser);
    await saveTokenToDb(testDbClient);
    
    newToken.token = generateOneTimeToken();

    // Invoke update method
    await tokenRepository.update(newToken);

    const token = await tokenRepository.getByUserIdAndType(
      newToken.userId,
      newToken.type
    );

    expect(token).toStrictEqual(newToken);
  });

  test("should be able to delete a token", async () => {
    const [ newUser, saveUserToDb ] = await generateTestUser();
    await saveUserToDb(testDbClient);
    const [ newToken, saveTokenToDb ] = await generateTestToken(newUser);
    await saveTokenToDb(testDbClient);

    // Invoke delete method
    await tokenRepository.delete(newToken);
    
    const token = await tokenRepository.getByUserIdAndType(
      newToken.userId,
      newToken.type
    );
    
    expect(token).toBeNull();
  });
});
