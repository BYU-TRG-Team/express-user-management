import { UUID } from "@typings";
import { Role } from "@typings/auth";
import { v4 as uuid } from "uuid";

interface UserInfo {
  userId?: UUID,
  username: string,
  verified?: boolean,
  password: string,
  email: string,
  name: string,
  roleId?: Role
}

class User {
  /*
  * Primary key: user_id
  */
  private _userId: UUID; 
  public username: string;
  public verified: boolean;
  public password: string;
  public email: string;
  public name: string;
  public roleId: Role;

  constructor(userInfo: UserInfo) {
    const {
      userId = uuid(),
      username,
      verified = false,
      password,
      email,
      name,
      roleId = Role.User
    } = userInfo;

    this._userId = userId;
    this.username = username;
    this.verified = verified;
    this.password = password;
    this.email = email;
    this.name = name;
    this.roleId = roleId;
  }

  get userId() {
    return this._userId;
  }
}

export default User;