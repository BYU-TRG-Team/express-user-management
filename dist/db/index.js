class DB {
    constructor(pool, objects) {
        if (DB.instance === undefined) {
            this.pool = pool;
            this.objects = objects;
            return;
        }
        throw new Error("DB cannot be instantiated more than once");
    }
}
export default DB;
//# sourceMappingURL=index.js.map