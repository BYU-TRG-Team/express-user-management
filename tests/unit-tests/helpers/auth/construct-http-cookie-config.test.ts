import { HTTP_COOKIE_LIFETIME, HTTP_COOKIE_OPTIONS } from "@constants/auth";
import { constructHTTPCookieConfig } from "@helpers/auth";
import { CookieOptions } from "express";

describe("tests constructHTTPCookieConfig method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should generate a cookie configuration utilizing HTTP_COOKIE_OPTIONS and an expiration date based on HTTP_COOKIE_LIFETIME", async () => {
    jest.spyOn(Date, "now").mockImplementation(() => currentDate.valueOf());
    
    const currentDate = new Date();
    const expectedCookieConfig: CookieOptions = {
      ...HTTP_COOKIE_OPTIONS,
      expires: new Date(
        currentDate.valueOf() + HTTP_COOKIE_LIFETIME
      )
    };

    // Invoke helper
    const cookieConfig = constructHTTPCookieConfig();
  
    expect(cookieConfig).toStrictEqual(expectedCookieConfig);
  });
});
