import { faker } from "@faker-js/faker";
import User from "@db/models/user";
import { DBClient } from "@typings/db";

/**
 * Generates a user using fake data
 */
export const generateTestUser = (): [User, (testDbClient: DBClient) => Promise<void>] => {
  const user = new User({
    username: faker.internet.userName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    verified: true,
    name: faker.internet.displayName(),
  });
  const saveToDb = async (testDbClient: DBClient) => {
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
  };

  return [
    user, 
    saveToDb
  ];
};