import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KpiSourceProvider } from "../src/modules/kpi-sync/types.js";

const makeProvider = (metadataVersion: string, options: { delay?: number; failMetadata?: boolean } = {}): KpiSourceProvider => ({
  source: "onedrive",
  isConfigured: () => true,
  getConfigurationWarning: () => null,
  getMetadata: vi.fn(async () => {
    if (options.failMetadata) throw new Error("Graph 500");
    if (options.delay) await new Promise((resolve) => setTimeout(resolve, options.delay));
    return { filename: "kpis.csv", sourceVersion: metadataVersion };
  }),
  download: vi.fn(async (metadata) => ({ metadata, buffer: Buffer.from("csv") }))
});

const loadService = async (state: { lastImportedETag?: string | null } | null, importImpl = vi.fn()) => {
  vi.resetModules();
  const updates: unknown[] = [];
  vi.doMock("../src/env.js", () => ({
    env: {
      KPI_SOURCE: "onedrive",
      KPI_SYNC_INTERVAL_MS: 1800000,
      KPI_SYNC_STABILITY_DELAY_MS: 0,
      KPI_SYNC_STARTUP: true
    },
    isProduction: false
  }));
  vi.doMock("../src/db/index.js", () => ({
    prisma: {
      kpiSyncState: {
        findUnique: vi.fn(async () => state),
        upsert: vi.fn(async ({ update, create }) => {
          updates.push(update);
          return { id: "kpi-sync", ...create, ...update };
        })
      }
    }
  }));
  vi.doMock("../src/modules/importaciones/service.js", () => ({
    importKpiCsv: importImpl
  }));
  const service = await import("../src/modules/kpi-sync/service.js");
  return { service, updates, importImpl };
};

describe("kpi sync", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("no importa cuando el eTag no cambio", async () => {
    const importCsv = vi.fn();
    const { service } = await loadService({ lastImportedETag: "v1" }, importCsv);
    const result = await service.runKpiSyncNow(makeProvider("v1"));
    expect(result.status).toBe("NO_CHANGES");
    expect(importCsv).not.toHaveBeenCalled();
  });

  it("importa cuando hay eTag nuevo y CSV valido", async () => {
    const importCsv = vi.fn(async () => ({
      duplicated: false,
      rowCount: 10,
      importacion: { id: "imp1", sha256: "hash", rowCount: 10 }
    }));
    const { service, updates } = await loadService({ lastImportedETag: "v1" }, importCsv);
    const result = await service.runKpiSyncNow(makeProvider("v2"));
    expect(result.status).toBe("IMPORTED");
    expect(importCsv).toHaveBeenCalledWith(expect.objectContaining({ source: "onedrive", sourceVersion: "v2" }));
    expect(updates).toContainEqual(expect.objectContaining({ status: "IMPORTED", lastImportedETag: "v2" }));
  });

  it("si el CSV nuevo es invalido conserva el ultimo eTag importado", async () => {
    const importCsv = vi.fn(async () => {
      throw new Error("CSV invalido");
    });
    const { service, updates } = await loadService({ lastImportedETag: "v1" }, importCsv);
    const result = await service.runKpiSyncNow(makeProvider("v2"));
    expect(result.status).toBe("ERROR");
    expect(updates).not.toContainEqual(expect.objectContaining({ lastImportedETag: "v2" }));
    expect(updates).toContainEqual(expect.objectContaining({ status: "ERROR", lastError: "CSV invalido" }));
  });

  it("si Graph falla no tira la app ni importa", async () => {
    const importCsv = vi.fn();
    const { service } = await loadService({ lastImportedETag: "v1" }, importCsv);
    const result = await service.runKpiSyncNow(makeProvider("v2", { failMetadata: true }));
    expect(result.status).toBe("ERROR");
    expect(importCsv).not.toHaveBeenCalled();
  });

  it("evita sincronizaciones simultaneas", async () => {
    const importCsv = vi.fn(async () => ({
      duplicated: false,
      rowCount: 1,
      importacion: { id: "imp1", sha256: "hash", rowCount: 1 }
    }));
    const { service } = await loadService({ lastImportedETag: "v1" }, importCsv);
    const first = service.runKpiSyncNow(makeProvider("v2", { delay: 50 }));
    const second = await service.runKpiSyncNow(makeProvider("v2"));
    expect(second.status).toBe("SKIPPED_RUNNING");
    await first;
  });
});
