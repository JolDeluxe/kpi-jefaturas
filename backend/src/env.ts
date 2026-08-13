import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

if (!process.env.DATABASE_URL && process.env.DATABASE_PATH) {
  process.env.DATABASE_URL = `file:${process.env.DATABASE_PATH}`;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DATABASE_PATH: z.string().optional(),
  JWT_SECRET: z.string().min(16),
  COOKIE_NAME: z.string().default("kpi_access"),
  REFRESH_COOKIE_NAME: z.string().default("kpi_refresh"),
  FRONTEND_DEV_ORIGIN: z.string().default("http://localhost:5173"),
  SYNC_API_KEY: z.string().min(1),
  KPI_SOURCE: z.enum(["disabled", "local", "onedrive"]).default("disabled"),
  KPI_LOCAL_FILE_PATH: z.string().optional(),
  KPI_SYNC_INTERVAL_MS: z.coerce.number().int().positive().default(1800000),
  KPI_SYNC_STABILITY_DELAY_MS: z.coerce.number().int().nonnegative().default(5000),
  KPI_SYNC_STARTUP: z.coerce.boolean().default(true),
  BOOTSTRAP_SEED: z.coerce.boolean().default(false),
  MS_TENANT_ID: z.string().optional(),
  MS_CLIENT_ID: z.string().optional(),
  MS_CLIENT_SECRET: z.string().optional(),
  ONEDRIVE_DRIVE_ID: z.string().optional(),
  ONEDRIVE_ITEM_ID: z.string().optional(),
  ONEDRIVE_USER_ID: z.string().optional(),
  ONEDRIVE_FILE_PATH: z.string().optional()
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
