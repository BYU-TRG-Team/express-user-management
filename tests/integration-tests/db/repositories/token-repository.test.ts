import { createTestDbClient, generateTestToken } from "@tests/helpers";
import { resetTestDb } from "@tests/helpers";
import { Client } from "pg";
import TokenRepository from "@db/repositories/token";
import { generateOneTimeToken } from "@helpers/auth";

jest.unmock("pg");

let testDbClient: Client;
let tokenRepository: TokenRepository;

describe("tests TokenRepository", () => {
  beforeAll(async () => {
    testDbClient = await createTestDbClient();
    tokenRepository = new TokenRepository(testDbClient);
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await testDbClient.end();
  });

  test("should be able to get all tokens", async () => {
    for (let i = 0; i < 50; ++i) {
      await generateTestToken();
    }

    const tokens = await tokenRepository.getAll();
    expect(tokens.length).toStrictEqual(50);
  });

  it("should be able to get a token given a userId and type", async () => {
    const newToken = await generateTestToken();
    const token = await tokenRepository.getByUserIdAndType(
      newToken.userId,
      newToken.type
    );
    expect(token).toStrictEqual(newToken);
  });

  it("should be able to create a token", async () => {
    const newToken = await generateTestToken({
      saveToDb: false
    });
    await tokenRepository.create(newToken);
    const token = await tokenRepository.getByUserIdAndType(
      newToken.userId,
      newToken.type
    );
    expect(token).toStrictEqual(newToken);
  });

  it("should be able to update a token", async () => {
    const newToken = await generateTestToken();
    newToken.token = generateOneTimeToken();
    await tokenRepository.update(newToken);
    const token = await tokenRepository.getByUserIdAndType(
      newToken.userId,
      newToken.type
    );
    expect(token).toStrictEqual(newToken);
  });

  it("should be able to delete a token", async () => {
    const newToken = await generateTestToken();
    await tokenRepository.delete(newToken);
    const token = await tokenRepository.getByUserIdAndType(
      newToken.userId,
      newToken.type
    );
    expect(token).toBeNull();
  });
});
