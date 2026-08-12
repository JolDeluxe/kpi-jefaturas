import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { prisma } from "./db/index.js";
import { env, isProduction } from "./env.js";
import { corsMiddleware } from "./middlewares/cors.js";
import authRoutes from "./routes/auth_rutas.js";
import cargosRoutes from "./routes/cargos_rutas.js";
import dashboardRoutes from "./routes/dashboard_rutas.js";
import importacionesRoutes from "./routes/importaciones_rutas.js";
import kpisRoutes from "./routes/kpis_rutas.js";
import syncRoutes from "./routes/sync_rutas.js";
import usuariosRoutes from "./routes/usuarios_rutas.js";
import { logger } from "./utils/logger.js";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(corsMiddleware);
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => logger.info({ method: req.method, path: req.path, statusCode: res.statusCode, ms: Date.now() - startedAt }, "http"));
  next();
});
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "kpi-jefaturas" }));
app.use("/api/auth", authRoutes);
app.use("/api/cargos", cargosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/kpis", kpisRoutes);
app.use("/api/importaciones", importacionesRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/usuarios", usuariosRoutes);

const frontendDist = path.resolve(process.cwd(), "../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 500;
  const message = isProduction && statusCode >= 500 ? "Error interno" : error instanceof Error ? error.message : "Error interno";
  if (statusCode >= 500) logger.error({ error }, message);
  res.status(statusCode).json({ message });
});

let server: ReturnType<typeof app.listen> | null = null;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server = app.listen(env.PORT, "0.0.0.0", () => {
    logger.info(`KPI Jefaturas listo en http://localhost:${env.PORT} (${env.NODE_ENV})`);
    if (!isProduction) logger.info("Frontend dev esperado en http://localhost:5173 con proxy /api");
  });
}

const shutdown = async () => {
  if (!server) {
    await prisma.$disconnect();
    process.exit(0);
  }
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { app };
