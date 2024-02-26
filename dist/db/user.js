class UserObject {
    constructor(db) {
        this.db = db;
    }
    create(username, email, password, roleId, name, client = this.db) {
        const query = `
      INSERT INTO identity.user (username, email, password, role_id, name) VALUES
      ($1, $2, $3, $4, $5) RETURNING *;
    `;
        return client.query(query, [username, email, password, roleId, name]);
    }
    setAttributes(attributes, values, userId) {
        let filters = "";
        const numParams = attributes.length;
        for (let i = 0; i < numParams; ++i) {
            if (i > 0)
                filters += ", ";
            filters += `${attributes[i]} = $${i + 1}`;
        }
        values.push(userId);
        const query = `
      UPDATE identity.user SET ${filters}
      WHERE user_id=$${numParams + 1} RETURNING *;
    `;
        return this.db.query(query, values);
    }
    findUsers(attributes, values) {
        let filters = "";
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
        return this.db.query(query, values);
    }
    getAllUsers() {
        const query = `
      SELECT * FROM identity.user ORDER BY user_id ASC;
    `;
        return this.db.query(query);
    }
    deleteUser(userId) {
        const query = `
      DELETE FROM identity.user WHERE user_id=$1;
    `;
        return this.db.query(query, [userId]);
    }
}
export default UserObject;
//# sourceMappingURL=user.js.map