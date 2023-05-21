const schema = "identity";
const tokenTable = { schema, name: "token"};

exports.up = (pgm) => {
  pgm.dropConstraint(tokenTable, "token_pkey")
  pgm.addConstraint(tokenTable, "primary_key_user_id_and_type", {
    primaryKey: ["user_id", "type"]
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint(tokenTable, "primary_key_user_id_and_type")
  pgm.addConstraint(tokenTable, "token_pkey", {
    primaryKey: "token"
  })
};
