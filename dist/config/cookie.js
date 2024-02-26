class CookieConfig {
    static generateCookieOptions(timestamp) {
        return {
            expires: new Date(604800000 + timestamp),
            httpOnly: false,
            secure: false,
            sameSite: "strict",
        };
    }
}
CookieConfig.cookieName = "TRG_AUTH_TOKEN";
export default CookieConfig;
//# sourceMappingURL=cookie.js.map