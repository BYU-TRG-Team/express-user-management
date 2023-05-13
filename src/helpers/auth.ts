import { CookieOptions } from "express";
import { HTTP_COOKIE_OPTIONS, HTTP_COOKIE_LIFETIME } from "@constants/auth";

export const constructHTTPCookieConfig = (): CookieOptions => {
  return {
    ...HTTP_COOKIE_OPTIONS,
    expires: new Date(
      Date.now() + HTTP_COOKIE_LIFETIME
    ),
  };
};