import Token from "@db/models/token";
import { generateTestUser } from "@tests/helpers/user";
import { createTestDbClient } from "@tests/helpers/db";
import { OneTimeTokenType } from "@typings/auth";

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
