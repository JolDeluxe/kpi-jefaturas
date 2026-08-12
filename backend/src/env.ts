import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  COOKIE_NAME: z.string().default("kpi_access"),
  REFRESH_COOKIE_NAME: z.string().default("kpi_refresh"),
  FRONTEND_DEV_ORIGIN: z.string().default("http://localhost:5173"),
  SYNC_API_KEY: z.string().min(1)
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
