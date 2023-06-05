import Token from "@db/models/token";
import User from "@db/models/user";
import { OneTimeTokenType } from "@typings/auth";
import { DBClient } from "@typings/db";


/**
 * Generates a token and an associated user using fake data. 
 */
export const generateTestToken = (user: User): [Token, (testDbClient: DBClient) => Promise<void>] => {
  const token = new Token({
    userId: user.userId,
    type: OneTimeTokenType.Verification
  });
  const saveToDb = async (testDbClient: DBClient) => {
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
  };

  return [
    token,
    saveToDb
  ];
};
