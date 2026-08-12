import cors from "cors";
import { env, isProduction } from "../env.js";

export const corsMiddleware = cors({
  origin: isProduction ? false : env.FRONTEND_DEV_ORIGIN,
  credentials: true
});
