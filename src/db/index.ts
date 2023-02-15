import pg from "pg";
import Token from "db/token";
import User from "db/user";

type DBObjects = {
  User: User;
  Token: Token;
}

class DB {
  public pool: pg.Pool;
  public objects: DBObjects;
  private static instance: DB;

  constructor(pool: pg.Pool, objects: DBObjects ) { 
    if (DB.instance === undefined) {
      this.pool = pool;
      this.objects = objects;
      return;
    }

    throw new Error("DB cannot be instantiated more than once");
  }
}

export default DB;