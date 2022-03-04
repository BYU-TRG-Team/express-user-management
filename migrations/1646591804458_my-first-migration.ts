/* eslint-disable camelcase */

const { PgLiteral } = require("node-pg-migrate");

const schema = "identity";
const userTable = { schema, name: "user" };
const tokenTable = { schema, name: "token"};


exports.up = (pgm) => {
  pgm.createSchema(schema, {
    ifNotExists: true
  });

  pgm.createTable(
    userTable,
    {
      user_id: { 
        type: "serial",
        primaryKey: true,
      },
      username: { 
        type: "varchar", 
        notNull: true,
        unique: true,
      },
      verified: { 
        type: "boolean", 
        notNull: true, 
        default: false,
      },
      password: { 
        type: "varchar", 
        notNull: true,
      },
      email: {
        type: "varchar",
        unique: true,
        notNull: true,
      },
      name: {
        type: "varchar",
        unique: true,
        notNull: true,
      },
      role_id: {
        type: "integer",
        notNull: true,
      }
    },
    {
      ifNotExists: true,
    }
  );

  pgm.createTable(
    tokenTable,
    {
      token: {
        type: "varchar",
        primaryKey: true,
        notNull: true,
      },
      user_id: {
        type: "integer",
        notNull: true,
        references: userTable,
        onDelete: "CASCADE"
      },
      type: {
        type: "varchar",
        notNull: "true"
      },
      created_at: { 
        type: "timestamptz", 
        notNull: false,
        default: new PgLiteral("current_timestamp")
      },
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable(tokenTable);
  pgm.dropTable(userTable);
};
