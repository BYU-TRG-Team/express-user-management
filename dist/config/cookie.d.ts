import { CookieOptions } from "express";
declare class CookieConfig {
    static cookieName: string;
    static generateCookieOptions(timestamp: number): CookieOptions;
}
export default CookieConfig;
