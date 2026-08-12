import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

const existingKpiColumns = db.prepare("PRAGMA table_info('Kpi')").all() as Array<{ name: string; type: string }>;
const existingKpiId = existingKpiColumns.find((column) => column.name === "id");
if (existingKpiId && existingKpiId.type.toUpperCase() !== "TEXT") {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS "KpiResultado";
    DROP TABLE IF EXISTS "Usuario";
    DROP TABLE IF EXISTS "Kpi";
    DROP TABLE IF EXISTS "Cargo";
    DROP TABLE IF EXISTS "Importacion";
    PRAGMA foreign_keys = ON;
  `);
  console.log("SQLite local reseteado para ajustar Kpi.id a texto.");
}

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "Importacion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "filename" TEXT NOT NULL,
  "sha256" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "importedAt" DATETIME,
  "status" TEXT NOT NULL,
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT
);

CREATE TABLE IF NOT EXISTS "Cargo" (
  "id" INTEGER NOT NULL PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "parentId" INTEGER,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "Cargo_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Cargo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Usuario" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "cargoId" INTEGER,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Usuario_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RefreshSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" DATETIME NOT NULL,
  "lastUsedAt" DATETIME,
  "revokedAt" DATETIME,
  "userAgent" TEXT,
  "ip" TEXT,
  CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Kpi" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "KpiResultado" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "importacionId" TEXT NOT NULL,
  "anio" INTEGER NOT NULL,
  "periodo" INTEGER NOT NULL,
  "cargoId" INTEGER NOT NULL,
  "orden" INTEGER NOT NULL,
  "kpiId" TEXT NOT NULL,
  "valorRaw" TEXT,
  "resultadoRaw" TEXT,
  "objetivoRaw" TEXT,
  "valorRealRaw" TEXT,
  "calificacionRaw" TEXT,
  "tendenciaRaw" TEXT,
  "parametrosRaw" TEXT,
  "sumaValorRaw" TEXT,
  "sumaCalificacionRaw" TEXT,
  "calificacionGeneralRaw" TEXT,
  "valorNumero" REAL,
  "resultadoNumero" REAL,
  "objetivoNumero" REAL,
  "valorRealNumero" REAL,
  "calificacionNumero" REAL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "KpiResultado_importacionId_fkey" FOREIGN KEY ("importacionId") REFERENCES "Importacion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "KpiResultado_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "KpiResultado_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "RefreshSession_userId_idx" ON "RefreshSession"("userId");
CREATE INDEX IF NOT EXISTS "RefreshSession_expiresAt_idx" ON "RefreshSession"("expiresAt");
CREATE INDEX IF NOT EXISTS "Importacion_sha256_status_idx" ON "Importacion"("sha256", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "KpiResultado_anio_periodo_cargoId_kpiId_key" ON "KpiResultado"("anio", "periodo", "cargoId", "kpiId");
CREATE INDEX IF NOT EXISTS "KpiResultado_cargoId_anio_periodo_idx" ON "KpiResultado"("cargoId", "anio", "periodo");
`);

db.close();
console.log(`SQLite listo en ${dbPath}`);
