import express from "express";
import cookieParser from "cookie-parser";
import dependencyInjection from "./di/index";
import constructAuthRoutes from "./routes/auth";
import constructUserRoutes from "./routes/user";
const init = (app, initOptions) => {
    app.use(express.json());
    app.use(cookieParser());
    app.use(express.urlencoded({
        extended: true,
    }));
    const di = dependencyInjection(initOptions);
    constructAuthRoutes(app, di);
    constructUserRoutes(app, di);
    return {
        userService: di.DB.objects.User,
    };
};
export default init;
export * from "./middleware/auth.js";
export * from "./types/auth.js";
export * from "./types/user.js";
//# sourceMappingURL=index.js.map