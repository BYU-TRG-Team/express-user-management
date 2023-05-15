class AuthConfig {
  private jwtSecret_: string;

  constructor(jwtSecret: string) {
    this.jwtSecret_ = jwtSecret;
  }

  get jwtSecret() {
    return this.jwtSecret_;
  }
}

export default AuthConfig;