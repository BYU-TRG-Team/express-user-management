import { CookieOptions } from "express";

type AuthConfig = {
  cookieName: string;
  cookieConfig: CookieOptions
}

const authConfig: AuthConfig = {
  cookieName: 'TRG_AUTH_TOKEN',
  cookieConfig: {
    expires: new Date(604800000 + Date.now()),
    httpOnly: false,
    secure: false,
    sameSite: 'strict',
  }
}


export default authConfig;