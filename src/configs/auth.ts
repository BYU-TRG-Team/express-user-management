class AuthConfig {
  private httpCookieSecret_: string;

  constructor(httpCookieSecret: string) {
    this.httpCookieSecret_ = httpCookieSecret;
  }

  get httpCookieSecret() {
    return this.httpCookieSecret_;
  }
}

export default AuthConfig;