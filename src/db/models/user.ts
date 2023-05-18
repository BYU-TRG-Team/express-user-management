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
  public userId: UUID;
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

    this.userId = userId;
    this.username = username;
    this.verified = verified;
    this.password = password;
    this.email = email;
    this.name = name;
    this.roleId = roleId;
  }
}

export default User;