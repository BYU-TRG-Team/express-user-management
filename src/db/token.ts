import { Pool, PoolClient } from "pg";
import { UUID } from "types/index.js";
import { SessionTokenType } from "../types/auth.js";
import { Token } from "../types/token.js";

class TokenObject {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  create(
    userId: UUID, 
    token: string, 
    type: SessionTokenType, 
    client: PoolClient | Pool = this.db
  ) {
    const query = `
      INSERT INTO identity.token (user_id, token, type) VALUES
      ($1, $2, $3) RETURNING *;
    `;

    return client.query<Token>(query, [userId, token, type]);
  }

  deleteToken(token: string) {
    const query = `
      DELETE FROM identity.token WHERE token=$1 RETURNING *;
    `;

    return this.db.query<Token>(query, [token]);
  }

  findTokens(
    attributes: any[], 
    values: any[]
  ) {
    let filters = '';

    for (let i = 0; i < attributes.length; ++i) {
      if (i > 0) {
        filters += `AND ${attributes[i]}=$${i + 1}`;
        continue;
      }

      filters += `${attributes[i]}=$${i + 1}`;
    }

    const query = `
      SELECT * FROM identity.token WHERE ${filters};
    `;

    return this.db.query<Token>(query, values);
  }
}

export default TokenObject;