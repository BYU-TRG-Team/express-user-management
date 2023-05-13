import { HTTP_COOKIE_LIFETIME, HTTP_COOKIE_OPTIONS } from "@constants/auth";
import { constructHTTPCookieConfig } from "@helpers/auth";

describe("tests constructHTTPCookieConfig method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should generate a cookie configuration utilizing HTTP_COOKIE_OPTIONS and an expiration date based on HTTP_COOKIE_LIFETIME", async () => {
    const currentDate = new Date();
    
    jest.spyOn(Date, "now").mockImplementation(() => currentDate.valueOf());

    const cookieConfig = constructHTTPCookieConfig();
    expect(cookieConfig).toStrictEqual({
      ...HTTP_COOKIE_OPTIONS,
      expires: new Date(
        currentDate.valueOf() + HTTP_COOKIE_LIFETIME
      )
    });
  });
});
