import { UUID } from "@typings";
import { ONE_TIME_TOKEN_LIFETIME } from "@constants/auth";
import { OneTimeTokenType } from "@typings/auth";
import { generateOneTimeToken } from "@helpers/auth";

interface TokenInfo {
  userId: UUID;
  type: OneTimeTokenType;
  token?: string;
  createdAt?: Date;
}

class Token {
  /*
  * Primary key: (user_id, type)
  */
  private _userId: UUID;
  private _type: OneTimeTokenType;
  public token: string;
  public createdAt: Date;

  constructor(tokenInfo: TokenInfo) {
    const {
      userId,
      type,
      token = generateOneTimeToken(),
      createdAt = new Date(),
    } = tokenInfo;

    this._userId = userId;
    this._type = type;
    this.token = token;
    this.createdAt = createdAt;
  }

  get userId() {
    return this._userId;
  }

  get type() {
    return this._type;
  }

  public isExpired() {
    const expiration = this.createdAt.getTime() + ONE_TIME_TOKEN_LIFETIME;
    return Date.now() > expiration;
  }
}

export default Token;