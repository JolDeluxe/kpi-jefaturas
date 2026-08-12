import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { getKnownParentId } from "../src/utils/cargo-scope.js";
import type { Role } from "../src/utils/cargo-scope.js";

const prisma = new PrismaClient();

const cargos = [
  [1, "MBC"],
  [100, "DIRECCION MBC"],
  [101, "JEFATURA DE COMPRAS"],
  [102, "JEFATURA DE CALIDAD"],
  [103, "JEFATURA DE PPCP"],
  [104, "JEFATURA DE LOGISTICA"],
  [200, "GERENCIA ADMINISTRATIVA"],
  [201, "JEFATURA DE CONTABILIDAD"],
  [300, "GERENCIA OPERATIVA"],
  [301, "JEFATURA DE PRODUCCION BOTAS I"],
  [302, "JEFATURA DE PRODUCCION BOTAS II"],
  [303, "JEFATURA DE PRODUCCION ACCESORIOS"],
  [304, "JEFATURA DE DESARROLLO BOTAS"],
  [305, "JEFATURA DE DESARROLLO ACCESORIOS"],
  [306, "JEFATURA DE INGENIERIA DE PROCESOS"],
  [307, "JEFATURA DE INGENIERIA DE COSTOS Y SISTEMA"],
  [308, "JEFATURA DE MANTENIMIENTO"],
  [309, "JEFATURA DE MAQUILAS"],
  [400, "GERENCIA DE CAPITAL HUMANO"],
  [401, "JEFATURA DE CAPITAL HUMANO"],
  [402, "JEFATURA DE GESTION DE CALIDAD"]
] as const;

const upsertUser = async (input: { nombre: string; email: string; password: string; role: Role; cargoId: number | null }) => {
  await prisma.usuario.upsert({
    where: { email: input.email },
    update: {
      nombre: input.nombre,
      role: input.role,
      cargoId: input.cargoId,
      passwordHash: await bcrypt.hash(input.password, 12),
      activo: true
    },
    create: {
      nombre: input.nombre,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
      cargoId: input.cargoId,
      activo: true
    }
  });
};

for (const [id, nombre] of cargos) {
  await prisma.cargo.upsert({
    where: { id },
    update: { nombre, parentId: getKnownParentId(id), activo: true },
    create: { id, nombre, parentId: getKnownParentId(id), activo: true }
  });
}

await upsertUser({
  nombre: "Administrador Desarrollo",
  email: process.env.SEED_ADMIN_EMAIL || "admin@mbc.local",
  password: process.env.SEED_ADMIN_PASSWORD || "Admin123!",
  role: "ADMIN",
  cargoId: null
});

await upsertUser({
  nombre: "Gerente Administrativa DEV",
  email: "gerente200@mbc.local",
  password: process.env.SEED_GERENTE_PASSWORD || "Gerente123!",
  role: "GERENTE",
  cargoId: 200
});

await upsertUser({
  nombre: "Jefe Contabilidad DEV",
  email: "jefe201@mbc.local",
  password: process.env.SEED_JEFE_PASSWORD || "Jefe123!",
  role: "JEFE",
  cargoId: 201
});

const roleForCargo = (cargoId: number): Role => {
  if (cargoId === 1 || cargoId === 100) return "DIRECCION";
  if (cargoId === 200 || cargoId === 300 || cargoId === 400) return "GERENTE";
  return "JEFE";
};

for (const [id, nombre] of cargos) {
  await upsertUser({
    nombre: `${nombre} DEV`,
    email: `cargo${id}@mbc.local`,
    password: process.env.SEED_CARGO_PASSWORD || "KpiDev123!",
    role: roleForCargo(id),
    cargoId: id
  });
}

console.log("Seed completo: cargos base, usuarios legacy y usuarios por cargo creados.");
await prisma.$disconnect();
