import { TEST_DB_CONNECTION_URL } from "@tests/constants";
import pg from "pg";

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
