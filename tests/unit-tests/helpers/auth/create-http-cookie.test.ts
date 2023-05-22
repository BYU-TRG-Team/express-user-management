import { HTTPCookieJWTPayload } from "@";
import User from "@db/models/user";
import { createHTTPCookie } from "@helpers/auth";
import { generateTestUser } from "@tests/helpers/user";
import jwt from "jsonwebtoken";
import { TEST_AUTH_CONFIG } from "@tests/constants";

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

    const token = createHTTPCookie(user, TEST_AUTH_CONFIG);
    
    const payload = jwt.verify(token, TEST_AUTH_CONFIG.httpCookieSecret);
    expect(payload).toMatchObject(expectedPayload);
  });
});