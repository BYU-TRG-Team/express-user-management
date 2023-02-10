import { CookieOptions } from "express";

class CookieConfig {
  static cookieName: string = "TRG_AUTH_TOKEN"
  static generateCookieOptions(timestamp: number): CookieOptions {
    return {
      expires: new Date(604800000 + timestamp),
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
    }
  }
}

export default CookieConfig;