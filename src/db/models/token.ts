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
  public userId: UUID;
  public type: OneTimeTokenType;
  public token: string;
  public createdAt: Date;

  constructor(tokenInfo: TokenInfo) {
    const {
      userId,
      type,
      token = generateOneTimeToken(),
      createdAt = new Date(),
    } = tokenInfo;

    this.userId = userId;
    this.type = type;
    this.token = token;
    this.createdAt = createdAt;
  }

  public isExpired() {
    const expiration = this.createdAt.getTime() + ONE_TIME_TOKEN_LIFETIME;
    return Date.now() > expiration;
  }
}

export default Token;