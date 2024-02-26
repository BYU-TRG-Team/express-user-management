import { Express } from "express";
import { DIContainer } from "../di/index";
declare const constructUserRoutes: (app: Express, di: DIContainer) => void;
export default constructUserRoutes;
