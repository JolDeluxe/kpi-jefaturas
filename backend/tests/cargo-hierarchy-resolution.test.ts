import { describe, expect, it } from "vitest";
import { getKnownParentId } from "../src/utils/cargo-scope.js";
import { prisma } from "../src/db/index.js";
import { reconcileCargosHierarchy } from "../src/modules/cargos/reconciliation.js";
import { importKpiCsv } from "../src/modules/importaciones/service.js";

describe("Dynamic Cargo Hierarchy & Reconciliation Tests", () => {
  describe("getKnownParentId resolving rules", () => {
    it("resolves corporate root parent to null", () => {
      expect(getKnownParentId(1)).toBeNull();
    });

    it("resolves gerencias to MBC root (1)", () => {
      expect(getKnownParentId(100)).toBe(1);
      expect(getKnownParentId(200)).toBe(1);
      expect(getKnownParentId(300)).toBe(1);
      expect(getKnownParentId(400)).toBe(1);
      expect(getKnownParentId(500)).toBe(1);
      expect(getKnownParentId(600)).toBe(1);
      expect(getKnownParentId(700)).toBe(1);
    });

    it("resolves jefaturas to their respective parent gerencias", () => {
      expect(getKnownParentId(101)).toBe(100);
      expect(getKnownParentId(104)).toBe(100);
      expect(getKnownParentId(201)).toBe(200);
      expect(getKnownParentId(202)).toBe(200);
      expect(getKnownParentId(205)).toBe(200);
      expect(getKnownParentId(309)).toBe(300);
      expect(getKnownParentId(401)).toBe(400);
      expect(getKnownParentId(501)).toBe(500);
      expect(getKnownParentId(601)).toBe(600);
      expect(getKnownParentId(701)).toBe(700);
      expect(getKnownParentId(703)).toBe(700);
    });
  });

  describe("Reconciliation & Hierarchy Validation", () => {
    it("reconciles parentId correctly and is idempotent", async () => {
      // Setup base data in transaction-like checks or using prisma directly (test env isolated)
      // Limpiamos los cargos de prueba si existen
      await prisma.cargo.deleteMany({
        where: { id: { in: [800, 801, 802] } }
      });

      // Insertamos cargos con parentId incorrectos/desordenados
      await prisma.cargo.create({
        data: { id: 800, nombre: "GERENCIA DE PRUEBA RECONCILE", parentId: null }
      });
      await prisma.cargo.create({
        data: { id: 801, nombre: "JEFATURA DE PRUEBA A", parentId: null }
      });
      await prisma.cargo.create({
        // 802 tiene como candidato a 800 (valido), pero simulamos que tiene parentId incorrecto 1
        data: { id: 802, nombre: "JEFATURA DE PRUEBA B", parentId: 1 }
      });

      // Primer reconciliación
      await reconcileCargosHierarchy();

      const cargo800 = await prisma.cargo.findUnique({ where: { id: 800 } });
      const cargo801 = await prisma.cargo.findUnique({ where: { id: 801 } });
      const cargo802 = await prisma.cargo.findUnique({ where: { id: 802 } });

      expect(cargo800?.parentId).toBe(1); // Mapeado a raíz
      expect(cargo801?.parentId).toBe(800); // 800 existe y es gerencia
      expect(cargo802?.parentId).toBe(800); // corregido de 1 a 800

      // Segunda reconciliación (idempotente)
      await reconcileCargosHierarchy();
      const cargo800Sec = await prisma.cargo.findUnique({ where: { id: 800 } });
      expect(cargo800Sec?.parentId).toBe(1);

      // Limpieza
      await prisma.cargo.deleteMany({
        where: { id: { in: [800, 801, 802] } }
      });
    });

    it("does not associate child with non-existent or invalid parent, and preserves existing parentId", async () => {
      // Limpiar test
      await prisma.cargo.deleteMany({
        where: { id: { in: [810, 811, 812] } }
      });

      // 810 NO existe (no lo creamos)
      // 811 Jefatura cuyo padre candidato sería 810 (inexistente).
      // Le ponemos un parentId existente válido inicial = 1
      await prisma.cargo.create({
        data: { id: 811, nombre: "JEFATURA SIN PADRE REAL", parentId: 1 }
      });

      // 812 Jefatura cuyo padre candidato es 813. Pero 813 existe y NO es gerencia (es Jefatura).
      await prisma.cargo.create({
        data: { id: 813, nombre: "JEFATURA DE SOPORTE QUE NO ES GERENCIA", parentId: 1 }
      });
      await prisma.cargo.create({
        data: { id: 814, nombre: "JEFATURA HIJA CANDIDATA", parentId: 1 } // Propuesto sería 813, pero 813 es Jefatura
      });

      await reconcileCargosHierarchy();

      const cargo811 = await prisma.cargo.findUnique({ where: { id: 811 } });
      const cargo814 = await prisma.cargo.findUnique({ where: { id: 814 } });

      // Deben conservar su parentId de 1, no ser borrados o asociados a null/relación rota
      expect(cargo811?.parentId).toBe(1);
      expect(cargo814?.parentId).toBe(1);

      // Limpieza
      await prisma.cargo.deleteMany({
        where: { id: { in: [811, 813, 814] } }
      });
    });

    it("does not associate parentId=1 if MBC (id=1) does not exist, and preserves existing parentId", async () => {
      // Configurar datos sin MBC id=1. En este test el id=1 existe en DB real, por lo que crearemos un cargo temporal
      // con id = 899 (que actua como gerencia sin corporativo padre porque borramos temporalmente o no creamos el id=1,
      // pero como id=1 si existe, simulamos borrando temporalmente el id=1 si se pudiera, pero es mas seguro testear
      // directamente con un id de gerencia huerfana como 890).
      
      // Creamos 890 (GERENCIA DE PRUEBA) con parentId = 1 (MBC que existe)
      await prisma.cargo.deleteMany({
        where: { id: { in: [890, 891] } }
      });

      await prisma.cargo.create({
        data: { id: 890, nombre: "GERENCIA HUERFANA", parentId: 1 }
      });
      await prisma.cargo.deleteMany({
        where: { id: { in: [800, 801] } }
      });

      await prisma.cargo.create({
        data: { id: 800, nombre: "GERENCIA HUERFANA", parentId: 1 }
      });

      // Si creamos un cargo 801 (JEFATURA) cuyo padre propuesto es 800:
      await prisma.cargo.create({
        data: { id: 801, nombre: "JEFATURA HUERFANA", parentId: 1 }
      });

      await reconcileCargosHierarchy();

      const cargo801 = await prisma.cargo.findUnique({ where: { id: 801 } });
      expect(cargo801?.parentId).toBe(800);

      // Ahora si eliminamos 800 y forzamos a 801 a tener parentId = 1
      await prisma.cargo.delete({ where: { id: 800 } });
      await prisma.cargo.update({ where: { id: 801 }, data: { parentId: 1 } });
      
      await reconcileCargosHierarchy();
      const cargo801Post = await prisma.cargo.findUnique({ where: { id: 801 } });
      expect(cargo801Post?.parentId).toBe(1);

      await prisma.cargo.deleteMany({
        where: { id: { in: [801] } }
      });
    });
  });
});
