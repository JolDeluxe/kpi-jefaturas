import { prisma } from "../../db/index.js";
import { assertCargoScope } from "../cargos/service.js";
import type { ScopeUser } from "../../utils/cargo-scope.js";

export const getDashboardResumen = async (user: ScopeUser, cargoId: number, anio: number, periodo: number) => {
  await assertCargoScope(user, cargoId);
  const first = await prisma.kpiResultado.findFirst({
    where: { cargoId, anio, periodo },
    include: { cargo: true },
    orderBy: [{ orden: "asc" }, { kpiId: "asc" }]
  });

  const periodos = await prisma.kpiResultado.findMany({
    where: { cargoId, anio },
    distinct: ["periodo"],
    select: { periodo: true },
    orderBy: { periodo: "asc" }
  });

  return {
    cargo: first?.cargo ?? null,
    anio,
    periodo,
    sumaValorRaw: first?.sumaValorRaw ?? null,
    sumaCalificacionRaw: first?.sumaCalificacionRaw ?? null,
    calificacionGeneralRaw: first?.calificacionGeneralRaw ?? null,
    periodosDisponibles: periodos.map((row) => row.periodo)
  };
};
