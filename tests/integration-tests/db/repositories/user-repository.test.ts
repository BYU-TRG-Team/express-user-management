import { createTestDbClient, resetTestDb } from "@tests/helpers/db";
import UserRepository from "@db/repositories/user";
import { generateTestUser } from "@tests/helpers/user";
import { Client } from "pg";

jest.unmock("pg");

let testDbClient: Client;
let userRepository: UserRepository;

describe("tests UserRepository", () => {
  beforeAll(async () => {
    testDbClient = await createTestDbClient();
    userRepository = new UserRepository(testDbClient);
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await testDbClient.end();
  });

  test("should be able to get all users", async () => {
    for (let i = 0; i < 50; ++i) {
      await generateTestUser();
    }

    const users = await userRepository.getAll();
    expect(users.length).toStrictEqual(50);
  });

  it("should be able to get a user by UUID", async () => {
    const newUser = await generateTestUser();
    const user = await userRepository.getByUUID(newUser.userId);
    expect(user).toStrictEqual(newUser);
  });

  it("should be able to get a user by username", async () => {
    const newUser = await generateTestUser();
    const user = await userRepository.getByUsername(newUser.username);
    expect(user).toStrictEqual(newUser);
  });

  it("should be able to get a user by email", async () => {
    const newUser = await generateTestUser();
    const user = await userRepository.getByEmail(newUser.email);
    expect(user).toStrictEqual(newUser);
  });

  it("should be able to create a user", async () => {
    const newUser = await generateTestUser({
      saveToDb: false
    });
    await userRepository.create(newUser);
    const user = await userRepository.getByUUID(newUser.userId);
    expect(user).toStrictEqual(newUser);
  });

  it("should be able to update a user", async () => {
    const newUser = await generateTestUser();
    newUser.verified = false;
    await userRepository.update(newUser);
    const user = await userRepository.getByUUID(newUser.userId);
    expect(user).toStrictEqual(newUser);
  });

  it("should be able to delete a user", async () => {
    const newUser = await generateTestUser();
    await userRepository.delete(newUser);
    const user = await userRepository.getByUUID(newUser.userId);
    expect(user).toBeNull();
  });
});
