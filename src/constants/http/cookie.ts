import { CookieOptions } from "express";

export const NAME = "TRG_AUTH_TOKEN";
export const OPTIONS = (timestamp: number): CookieOptions  => {
  return {
    expires: new Date(604800000 + timestamp),
    httpOnly: false,
    secure: false,
    sameSite: "strict",
  };
};