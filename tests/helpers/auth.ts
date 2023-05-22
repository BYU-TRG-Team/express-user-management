import { HTTPCookieJWTPayload, Role } from "@typings/auth";
import { v4 as uuid } from "uuid";
import { faker } from "@faker-js/faker";

/**
 * Generates a payload for the HTTP Cookie JWT using fake data
 */
export const generateHTTPCookieJWTPayload = () => {
  const payload: HTTPCookieJWTPayload = {
    id: uuid(),
    role: Role.Admin,
    verified: true,
    username: faker.internet.userName()
  };

  return payload;
};