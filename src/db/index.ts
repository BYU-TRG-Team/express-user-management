import pg from "pg";
import Token from "@db/token";
import User from "@db/user";

type DBObjects = {
  User: User;
  Token: Token;
}

class DB {
  public pool: pg.Pool;
  public objects: DBObjects;

  constructor(pool: pg.Pool, objects: DBObjects ) { 
    this.pool = pool;
    this.objects = objects;
  }
}

export default DB;