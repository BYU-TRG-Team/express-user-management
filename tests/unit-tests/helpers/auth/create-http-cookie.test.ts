import { HTTPCookieJWTPayload } from "@";
import AuthConfig from "@configs/auth";
import User from "@db/models/user";
import { createHTTPCookie } from "@helpers/auth";
import { TEST_AUTH_SECRET } from "@tests/constants";
import { generateTestUser } from "@tests/helpers";
import jwt from "jsonwebtoken";

const authConfig = new AuthConfig(TEST_AUTH_SECRET);
let user: User;

describe("tests createHTTPCookie method", () => {
  beforeAll(async () => {
    user = await generateTestUser({
      saveToDb: false
    });
  });

  test("should create a JWT with the correct payload", () => {
    const expectedPayload: HTTPCookieJWTPayload = {
      id: user.userId,
      role: user.roleId,
      verified: user.verified,
      username: user.username,
    };

    const token = createHTTPCookie(user, authConfig);
    
    const payload = jwt.verify(token, authConfig.httpCookieSecret);
    expect(payload).toMatchObject(expectedPayload);
  });
});