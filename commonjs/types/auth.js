"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionTokenType = exports.Role = void 0;
var Role;
(function (Role) {
    Role[Role["Admin"] = 3] = "Admin";
    Role[Role["Staff"] = 2] = "Staff";
    Role[Role["User"] = 1] = "User";
    Role[Role["Inactive"] = 0] = "Inactive";
})(Role = exports.Role || (exports.Role = {}));
var SessionTokenType;
(function (SessionTokenType) {
    SessionTokenType["Password"] = "password";
    SessionTokenType["Verification"] = "verification";
})(SessionTokenType = exports.SessionTokenType || (exports.SessionTokenType = {}));
//# sourceMappingURL=auth.js.map