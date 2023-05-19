import User from "@db/models/user";
import { TEST_DB_CONNECTION_URL } from "@tests/constants";
import { faker } from "@faker-js/faker";
import pg from "pg";
import Token from "@db/models/token";
import { OneTimeTokenType } from "@";

/**
 * Constructs a pg client and starts a connection with the database dictated by TEST_DB_CONNECTION_URL
 */
export const createTestDbClient = async () => {
  const client = new pg.Client({
    connectionString: TEST_DB_CONNECTION_URL,
    ssl: false
  }); 
  await client.connect();

  return client;
};

/**
 * Resets the test database
 */
export const resetTestDb = async () => {
  const testDbClient = await createTestDbClient();
  await testDbClient.query("DELETE FROM identity.user;");
  await testDbClient.query("DELETE FROM identity.token;");
  await testDbClient.end();
};

/**
 * Generates a user using fake data
 */
export const generateTestUser = async (
  options: {
    saveToDb?: boolean
  } = {}
): Promise<User> => {
  const { saveToDb = true } = options;
  const user = new User({
    username: faker.internet.userName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    verified: true,
    name: faker.internet.displayName(),
  });


  if (saveToDb) {
    const testDbClient = await createTestDbClient();
    await testDbClient.query(
      `
        INSERT INTO identity.user (user_id, username, verified, password, email, name, role_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *;
      `, 
      [
        user.userId,
        user.username,
        user.verified,
        user.password,
        user.email,
        user.name,
        user.roleId
      ]
    );
    await testDbClient.end();
  }

  return user;
};

/**
 * Generates a token and an associated user using fake data. 
 */
export const generateTestToken = async (
  options: {
    saveToDb?: boolean,
  } = {}
): Promise<Token> => {
  const { saveToDb = true } = options;
  const user = await generateTestUser();
  const token = new Token({
    userId: user.userId,
    type: OneTimeTokenType.Verification
  });

  if (saveToDb) {
    const testDbClient = await createTestDbClient();
    await testDbClient.query(
      `
        INSERT INTO identity.token (user_id, token, type, created_at) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *;
      `, 
      [
        token.userId,
        token.token,
        token.type,
        token.createdAt
      ]
    );
    await testDbClient.end();
  }

  return token;
};