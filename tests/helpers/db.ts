import { DBClient } from "@typings/db";

/**
 * Resets the test database
 */
export const resetTestDb = async (testDbClient: DBClient) => { 
  await testDbClient.query("DELETE FROM identity.user;");
  await testDbClient.query("DELETE FROM identity.token;");
};
