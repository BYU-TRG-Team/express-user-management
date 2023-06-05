import Repository from "@db/repositories/repository";
import Token from "@db/models/token";
import { DBClient, TokenSchema } from "@typings/db";
import { OneTimeTokenType } from "@typings/auth";
import { UUID } from "@typings";

class TokenRepository extends Repository<Token>{
  private dbClient_: DBClient;
  
  constructor(dbClient: DBClient) {
    super();
    this.dbClient_ = dbClient;
  }

  async getAll() {
    const query = "SELECT * FROM identity.token;";
    const { rows } = await this.dbClient_.query<TokenSchema>(query);

    return rows.map((rawToken) => {
      return new Token({
        ...rawToken,
        type: rawToken.type as OneTimeTokenType,
        userId: rawToken.user_id,
        createdAt: rawToken.created_at
      });
    });
  }

  async getByUserIdAndType(
    userId: UUID,
    type: OneTimeTokenType
  ) {
    const query = "SELECT * FROM identity.token WHERE user_id=$1 AND type=$2;";
    const { rows } = await this.dbClient_.query<TokenSchema>(query, [userId, type]);

    if (rows.length === 0) return null;

    const rawToken = rows[0];
    return new Token({
      ...rawToken,
      type: rawToken.type as OneTimeTokenType,
      userId: rawToken.user_id,
      createdAt: rawToken.created_at
    });
  }

  async create(token: Token) {
    const query = `
      INSERT INTO identity.token (user_id, token, type, created_at) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
    await this.dbClient_.query<TokenSchema>(
      query, 
      [
        token.userId,
        token.token,
        token.type,
        token.createdAt
      ]
    );
  }

  async update(token: Token) {
    const query = `
      UPDATE identity.token SET
      token=$1,
      created_at=$2
      WHERE user_id=$3 AND type=$4
      RETURNING *;
    `;
    await this.dbClient_.query<TokenSchema>(
      query, 
      [
        token.token,
        token.createdAt,
        token.userId,
        token.type
      ]
    );
  }

  async delete(token: Token) {
    const query = "DELETE FROM identity.token WHERE user_id=$1 AND type=$2;";
    await this.dbClient_.query<TokenSchema>(query, [token.userId, token.type]);
  }
}

export default TokenRepository;