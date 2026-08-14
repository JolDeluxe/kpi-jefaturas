import { prisma } from "../../db/index.js";
import { getKnownParentId } from "../../utils/cargo-scope.js";
import { logger } from "../../utils/logger.js";

/**
 * Reconcilia la jerarquía de cargos en la base de datos de manera defensiva e idempotente.
 * Asigna parentId a los cargos existentes según las reglas lógicas:
 *   - Si es 1 (MBC) -> null
 *   - Si es gerencia/dirección (múltiplo de 100) -> 1
 *   - Si es jefatura -> su gerencia candidato (redondeo a la centena).
 *
 * Protecciones:
 *   1. Valida que el padre candidato exista en la base de datos.
 *   2. Valida que el padre candidato sea una Gerencia o Dirección (nombre contiene "GERENCIA" o "DIRECCION", o id es 1).
 *   3. Si no es válido o no existe, conserva el parentId existente en lugar de sobrescribirlo con null.
 */
export const reconcileCargosHierarchy = async (): Promise<void> => {
  logger.info("[RECONCILIATION] Iniciando reconciliacion de jerarquia de cargos...");
  try {
    const cargos = await prisma.cargo.findMany();
    const cargosMap = new Map(cargos.map((c) => [c.id, c]));

    let updatedCount = 0;

    for (const cargo of cargos) {
      if (cargo.id === 1) {
        if (cargo.parentId !== null) {
          await prisma.cargo.update({
            where: { id: cargo.id },
            data: { parentId: null }
          });
          updatedCount++;
        }
        continue;
      }

      // 1. Proponer candidato matemático
      let proposedParentId: number | null = null;
      if (cargo.id % 100 === 0) {
        proposedParentId = 1;
      } else {
        proposedParentId = Math.floor(cargo.id / 100) * 100;
      }

      // 2. Validar candidato de manera defensiva
      let finalParentId = cargo.parentId; // Valor por defecto: conservar el existente

      if (proposedParentId !== null) {
        const parentCandidate = cargosMap.get(proposedParentId);
        if (parentCandidate) {
          const nombreNormalized = parentCandidate.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
          const esValido = nombreNormalized.startsWith("GERENCIA") || nombreNormalized.startsWith("DIRECCION") || parentCandidate.id === 1;
          if (esValido) {
            finalParentId = proposedParentId;
          }
        }
      }

      // 3. Aplicar cambio si difiere del actual
      if (finalParentId !== cargo.parentId) {
        await prisma.cargo.update({
          where: { id: cargo.id },
          data: { parentId: finalParentId }
        });
        updatedCount++;
        // Actualizar el mapa local para coherencia en la iteración
        cargo.parentId = finalParentId;
      }
    }

    logger.info(`[RECONCILIATION] Reconciliacion completada. Cargos actualizados: ${updatedCount}`);
  } catch (error) {
    logger.error({ error }, "[RECONCILIATION] Error durante la reconciliacion de jerarquia");
    throw error;
  }
};
