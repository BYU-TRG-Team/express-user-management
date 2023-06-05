import { HTTPCookieJWTPayload } from "@";
import { createHTTPCookie } from "@helpers/auth";
import { generateTestUser } from "@tests/helpers/user";
import jwt from "jsonwebtoken";
import { TEST_AUTH_CONFIG } from "@tests/constants";

describe("tests createHTTPCookie method", () => {
  test("should create a JWT with the correct payload", async () => {
    const [ user ] = await generateTestUser();
    const expectedPayload: HTTPCookieJWTPayload = {
      id: user.userId,
      role: user.roleId,
      verified: user.verified,
      username: user.username,
    };
    
    // Invoke helper
    const token = createHTTPCookie(user, TEST_AUTH_CONFIG);
    
    const payload = jwt.verify(token, TEST_AUTH_CONFIG.httpCookieSecret);
    expect(payload).toMatchObject(expectedPayload);
  });
});