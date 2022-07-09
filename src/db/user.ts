import { Pool, PoolClient } from "pg";
import { UUID } from "../types/index.js";
import { Role } from "../types/auth.js";
import { User } from "../types/user.js";

class UserObject {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  create(
    username: string, 
    email: string, 
    password: string, 
    roleId: Role, 
    name: string, 
    client: PoolClient | Pool = this.db
  ) {
    const query = `
      INSERT INTO identity.user (username, email, password, role_id, name) VALUES
      ($1, $2, $3, $4, $5) RETURNING *;
    `;

    return client.query<User>(query, [username, email, password, roleId, name]);
  }

  setAttributes(
    attributes: any[], 
    values: any[], 
    userId: UUID
  ) {
    let filters = '';
    const numParams = attributes.length;

    for (let i = 0; i < numParams; ++i) {
      if (i > 0) filters += ', ';

      filters += `${attributes[i]} = $${i + 1}`;
    }

    values.push(userId);

    const query = `
      UPDATE identity.user SET ${filters}
      WHERE user_id=$${numParams + 1} RETURNING *;
    `;

    return this.db.query<User>(query, values);
  }

  findUsers(
    attributes: any[], 
    values: any[]
  ) {
    let filters = '';

    for (let i = 0; i < attributes.length; ++i) {
      if (i > 0) {
        filters += `AND ${attributes[i]}=$${i + 1}`;
        continue;
      }

      filters += `WHERE ${attributes[i]}=$${i + 1}`;
    }

    const query = `
      SELECT * FROM identity.user ${filters};
    `;

    return this.db.query<User>(query, values);
  }

  getAllUsers() {
    const query = `
      SELECT * FROM identity.user ORDER BY user_id ASC;
    `;

    return this.db.query<User>(query);
  }

  deleteUser(userId: UUID) {
    const query = `
      DELETE FROM identity.user WHERE user_id=$1;
    `;

    return this.db.query<User>(query, [userId]);
  }
}

export default UserObject;