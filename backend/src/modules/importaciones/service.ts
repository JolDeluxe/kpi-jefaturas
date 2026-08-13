import type { PrismaClient } from "@prisma/client";
import path from "node:path";
import { prisma } from "../../db/index.js";
import { parseKpiCsvContent, parseKpiCsvFile, type ParsedKpiRow } from "../../utils/csv-ingest.js";
import { getKnownParentId } from "../../utils/cargo-scope.js";
import { hashBufferSha256, hashFileSha256 } from "../../utils/hash-file.js";
import { audit } from "../../utils/audit-log.js";

export type ImportCsvInput =
  | { type: "file"; filePath: string; filename?: string; source?: string; sourceVersion?: string | null }
  | { type: "buffer"; buffer: Buffer; filename: string; source?: string; sourceVersion?: string | null };

const rowToResultData = (row: ParsedKpiRow, importacionId: string) => ({
  importacionId,
  anio: row.anio,
  periodo: row.periodo,
  cargoId: row.cargoId,
  orden: row.orden,
  kpiId: row.kpiId,
  valorRaw: row.valorRaw,
  resultadoRaw: row.resultadoRaw,
  objetivoRaw: row.objetivoRaw,
  valorRealRaw: row.valorRealRaw,
  calificacionRaw: row.calificacionRaw,
  tendenciaRaw: row.tendenciaRaw,
  parametrosRaw: row.parametrosRaw,
  sumaValorRaw: row.sumaValorRaw,
  sumaCalificacionRaw: row.sumaCalificacionRaw,
  calificacionGeneralRaw: row.calificacionGeneralRaw,
  valorNumero: row.valorNumero,
  resultadoNumero: row.resultadoNumero,
  objetivoNumero: row.objetivoNumero,
  valorRealNumero: row.valorRealNumero,
  calificacionNumero: row.calificacionNumero
});

const uniqueBy = <T, K>(items: T[], getKey: (item: T) => K) => {
  const map = new Map<K, T>();
  for (const item of items) map.set(getKey(item), item);
  return Array.from(map.values());
};

const getCargoDepth = (cargoId: number) => {
  let depth = 0;
  let parentId = getKnownParentId(cargoId);
  while (parentId !== null) {
    depth += 1;
    parentId = getKnownParentId(parentId);
  }
  return depth;
};

export const importKpiCsv = async (input: ImportCsvInput, client: PrismaClient = prisma) => {
  const filename = input.type === "file" ? input.filename || path.basename(input.filePath) : input.filename;
  const source = input.source || "manual";
  const sourceVersion = input.sourceVersion || null;
  const sha256 = input.type === "file" ? await hashFileSha256(input.filePath) : hashBufferSha256(input.buffer);

  const previous = await client.importacion.findFirst({ where: { sha256, status: "SUCCESS" } });
  if (previous) {
    const skipped = await client.importacion.create({
      data: { filename, sha256, source, sourceVersion, status: "SKIPPED_DUPLICATE", rowCount: 0, importedAt: new Date(), errorMessage: `Archivo ya importado en ${previous.id}` }
    });
    return { importacion: skipped, duplicated: true, rowCount: 0 };
  }

  const importacion = await client.importacion.create({ data: { filename, sha256, source, sourceVersion, status: "PROCESSING" } });

  try {
    const rows = input.type === "file" ? await parseKpiCsvFile(input.filePath) : parseKpiCsvContent(input.buffer.toString("utf8"));

    await client.$transaction(async (tx) => {
      const cargos = uniqueBy(rows, (row) => row.cargoId).sort((a, b) => {
        const depthDiff = getCargoDepth(a.cargoId) - getCargoDepth(b.cargoId);
        return depthDiff || a.cargoId - b.cargoId;
      });

      for (const cargo of cargos) {
        await tx.cargo.upsert({
          where: { id: cargo.cargoId },
          update: { nombre: cargo.cargoNombre, parentId: getKnownParentId(cargo.cargoId), activo: true },
          create: { id: cargo.cargoId, nombre: cargo.cargoNombre, parentId: getKnownParentId(cargo.cargoId), activo: true }
        });
      }

      for (const kpi of uniqueBy(rows, (row) => row.kpiId)) {
        await tx.kpi.upsert({
          where: { id: kpi.kpiId },
          update: { nombre: kpi.kpiNombre, activo: true },
          create: { id: kpi.kpiId, nombre: kpi.kpiNombre, activo: true }
        });
      }

      await tx.kpiResultado.deleteMany();

      for (const row of rows) {
        const data = rowToResultData(row, importacion.id);
        await tx.kpiResultado.create({ data });
      }

      await tx.importacion.update({
        where: { id: importacion.id },
        data: { status: "SUCCESS", importedAt: new Date(), rowCount: rows.length }
      });
    });

    const complete = await client.importacion.findUniqueOrThrow({ where: { id: importacion.id } });
    audit("CSV_IMPORT_SUCCESS", { importacionId: complete.id, filename, rowCount: rows.length, duplicated: false });
    return { importacion: complete, duplicated: false, rowCount: rows.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido importando CSV";
    await client.importacion.update({ where: { id: importacion.id }, data: { status: "FAILED", importedAt: new Date(), errorMessage: message } });
    audit("CSV_IMPORT_FAILURE", { importacionId: importacion.id, filename });
    throw error;
  }
};

export const listImportaciones = () => prisma.importacion.findMany({ orderBy: { createdAt: "desc" }, take: 50 });

export const getImportStatus = async () => {
  const latest = await prisma.importacion.findFirst({ orderBy: { createdAt: "desc" } });
  const successCount = await prisma.importacion.count({ where: { status: "SUCCESS" } });
  return { latest, successCount };
};
