interface AuthInfo {
  httpCookieSecret: string;
  httpCookieName: string;
}

class AuthConfig {
  private httpCookieSecret_: string;
  private httpCookieName_: string;

  constructor(authInfo: AuthInfo) {
    const {
      httpCookieSecret,
      httpCookieName,
    } = authInfo;

    this.httpCookieSecret_ = httpCookieSecret;
    this.httpCookieName_ = httpCookieName;
  }

  get httpCookieSecret() {
    return this.httpCookieSecret_;
  }

  get httpCookieName() {
    return this.httpCookieName_;
  }
}

export default AuthConfig;