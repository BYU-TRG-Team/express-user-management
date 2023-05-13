import { CookieOptions } from "express";

export const HTTP_COOKIE_NAME = "TRG_AUTH_TOKEN";
export const HTTP_COOKIE_LIFETIME = 604_800_000; // 7 days
export const HTTP_COOKIE_OPTIONS: CookieOptions = Object.freeze({
  httpOnly: false,
  secure: false,
  sameSite: "strict",
});