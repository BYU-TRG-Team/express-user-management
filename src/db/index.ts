import pg, { PoolConfig } from "pg";
import Token from "@db/token";
import User from "@db/user";

type DBObjects = {
  User: User;
  Token: Token;
}

class DB {
  public connectionPool: pg.Pool;
  public objects: DBObjects;

  constructor(dbClientConfig: PoolConfig) { 
    this.connectionPool = new pg.Pool(dbClientConfig);
    this.objects = {
      User: new User(this.connectionPool),
      Token: new Token(this.connectionPool),
    };
  }
}

export default DB;