import { prisma } from "../../db/index.js";
import { assertCargoScope } from "../cargos/service.js";
import type { ScopeUser } from "../../utils/cargo-scope.js";

export const listKpis = async (user: ScopeUser, cargoId: number, anio: number, periodo: number) => {
  await assertCargoScope(user, cargoId);
  return prisma.kpiResultado.findMany({
    where: { cargoId, anio, periodo },
    include: { kpi: true, cargo: true },
    orderBy: [{ orden: "asc" }, { kpiId: "asc" }]
  });
};

export const listAvailablePeriods = async (user: ScopeUser, cargoId: number, anio: number) => {
  await assertCargoScope(user, cargoId);
  const rows = await prisma.kpiResultado.findMany({
    where: { cargoId, anio },
    distinct: ["periodo"],
    select: { periodo: true },
    orderBy: { periodo: "asc" }
  });
  return rows.map((row) => row.periodo);
};

export const listAvailableYears = async (user: ScopeUser, cargoId: number) => {
  await assertCargoScope(user, cargoId);
  const rows = await prisma.kpiResultado.findMany({
    where: { cargoId },
    distinct: ["anio"],
    select: { anio: true },
    orderBy: { anio: "desc" }
  });
  return rows.map((row) => row.anio);
};
