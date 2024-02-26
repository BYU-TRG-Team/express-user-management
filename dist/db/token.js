class TokenObject {
    constructor(db) {
        this.db = db;
    }
    create(userId, token, type, client = this.db) {
        const query = `
      INSERT INTO identity.token (user_id, token, type) VALUES
      ($1, $2, $3) RETURNING *;
    `;
        return client.query(query, [userId, token, type]);
    }
    deleteToken(token) {
        const query = `
      DELETE FROM identity.token WHERE token=$1 RETURNING *;
    `;
        return this.db.query(query, [token]);
    }
    findTokens(attributes, values) {
        let filters = "";
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
        return this.db.query(query, values);
    }
}
export default TokenObject;
//# sourceMappingURL=token.js.map