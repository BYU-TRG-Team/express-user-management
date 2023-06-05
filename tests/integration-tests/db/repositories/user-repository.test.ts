import { resetTestDb } from "@tests/helpers/db";
import UserRepository from "@db/repositories/user";
import { generateTestUser } from "@tests/helpers/user";
import { constructTestBottle } from "@tests/helpers/library";
import { Pool } from "pg";

jest.unmock("pg");

let testDbClient: Pool;
let userRepository: UserRepository;

describe("tests UserRepository", () => {
  beforeAll(async () => {
    const testBottle = constructTestBottle();
    testDbClient = testBottle.container.DBClientPool.connectionPool;
    userRepository = new UserRepository(testDbClient);
  });

  afterEach(async () => {
    await resetTestDb(testDbClient);
    jest.restoreAllMocks();
  });

  afterAll(() => {
    testDbClient.end();
  });

  test("should be able to get all users", async () => {
    for (let i = 0; i < 50; ++i) {
      const [ _newUser, saveToDb ] = await generateTestUser();
      await saveToDb(testDbClient);
    }

    const users = await userRepository.getAll();
    expect(users.length).toStrictEqual(50);
  });

  test("should be able to get a user by UUID", async () => {
    const [ newUser, saveToDb ] = await generateTestUser();
    await saveToDb(testDbClient);

    // Invoke getByUUID method
    const user = await userRepository.getByUUID(newUser.userId);

    expect(user).toStrictEqual(newUser);
  });

  test("should be able to get a user by username", async () => {
    const [ newUser, saveToDb ] = await generateTestUser();
    await saveToDb(testDbClient);

    // Invoke getByUsername method
    const user = await userRepository.getByUsername(newUser.username);

    expect(user).toStrictEqual(newUser);
  });

  test("should be able to get a user by email", async () => {
    const [ newUser, saveToDb ] = await generateTestUser();
    await saveToDb(testDbClient);
    
    // Invoke getByEmail method
    const user = await userRepository.getByEmail(newUser.email);

    expect(user).toStrictEqual(newUser);
  });

  test("should be able to create a user", async () => {
    const [ newUser ] = await generateTestUser();

    // Invoke create method
    await userRepository.create(newUser);

    const user = await userRepository.getByUUID(newUser.userId);
    expect(user).toStrictEqual(newUser);
  });

  test("should be able to update a user", async () => {
    const [ newUser, saveToDb ] = await generateTestUser();
    await saveToDb(testDbClient);
    newUser.verified = false;

    // Invoke update method
    await userRepository.update(newUser);

    const user = await userRepository.getByUUID(newUser.userId);
    expect(user).toStrictEqual(newUser);
  });

  test("should be able to delete a user", async () => {
    const [ newUser, saveToDb ] = await generateTestUser();
    await saveToDb(testDbClient);

    // Invoke delete method
    await userRepository.delete(newUser);
    
    const user = await userRepository.getByUUID(newUser.userId);
    expect(user).toBeNull();
  });
});
