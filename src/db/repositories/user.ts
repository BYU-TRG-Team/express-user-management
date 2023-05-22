import Repository from "@db/repositories/repository";
import User from "@db/models/user";
import { UserSchema } from "@typings/db";
import { PoolClient, Pool, Client } from "pg";
import { UUID } from "@typings";

class UserRepository extends Repository<User>{
  private dbClient_: PoolClient | Pool | Client;
  
  constructor(dbClient: PoolClient | Pool | Client) {
    super();
    this.dbClient_ = dbClient;
  }

  async getAll() {
    const query = "SELECT * FROM identity.user ORDER BY user_id ASC;";
    const { rows } = await this.dbClient_.query<UserSchema>(query);

    return rows.map((rawUser) => {
      return new User({
        ...rawUser,
        userId: rawUser.user_id,
        roleId: rawUser.role_id
      });
    });
  }

  async getByUUID(uuid: UUID) {
    const query = "SELECT * FROM identity.user WHERE user_id=$1;";
    const { rows } = await this.dbClient_.query<UserSchema>(query, [uuid]);

    if (rows.length === 0) return null;

    const rawUser = rows[0];
    return new User({
      ...rawUser,
      userId: rawUser.user_id,
      roleId: rawUser.role_id
    });
  }

  async getByUsername(username: string) {
    const query = "SELECT * FROM identity.user WHERE username=$1;";
    const { rows } = await this.dbClient_.query<UserSchema>(query, [username]);

    if (rows.length === 0) return null;

    const rawUser = rows[0];
    return new User({
      ...rawUser,
      userId: rawUser.user_id,
      roleId: rawUser.role_id
    });
  }

  async getByEmail(email: string) {
    const query = "SELECT * FROM identity.user WHERE email=$1;";
    const { rows } = await this.dbClient_.query<UserSchema>(query, [email]);

    if (rows.length === 0) return null;

    const rawUser = rows[0];
    return new User({
      ...rawUser,
      userId: rawUser.user_id,
      roleId: rawUser.role_id
    });
  }

  async create(user: User) {
    const query = `
      INSERT INTO identity.user (user_id, username, verified, password, email, name, role_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *;
    `;
    await this.dbClient_.query<User>(
      query, 
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
  }

  async update(user: User) {
    const query = `
      UPDATE identity.user SET
      username=$1,
      verified=$2,
      password=$3,
      email=$4,
      name=$5, 
      role_id=$6
      WHERE user_id=$7
      RETURNING *;
    `;
    await this.dbClient_.query<User>(
      query, 
      [
        user.username,
        user.verified,
        user.password,
        user.email,
        user.name,
        user.roleId,
        user.userId,
      ]
    );
  }

  async delete(user: User) {
    const query = "DELETE FROM identity.user WHERE user_id=$1;";
    await this.dbClient_.query<UserSchema>(query, [user.userId]);
  }
}

export default UserRepository;