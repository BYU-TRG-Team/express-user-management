import User from "@db/models/user";
import { TEST_DB_CONNECTION_URL } from "@tests/constants";
import { faker } from "@faker-js/faker";
import pg from "pg";

export const createTestDbClient = async () => {
  const client = new pg.Client({
    connectionString: TEST_DB_CONNECTION_URL,
    ssl: false
  }); 
  await client.connect();

  return client;
};

export const resetTestDb = async () => {
  const testDbClient = await createTestDbClient();
  await testDbClient.query("DELETE FROM identity.user;");
  await testDbClient.end();
};

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

