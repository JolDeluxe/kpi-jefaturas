import bcrypt from "bcryptjs";
import { prisma } from "../../db/index.js";
import type { Role } from "../../utils/cargo-scope.js";
import { audit } from "../../utils/audit-log.js";
import { validatePassword } from "../auth/password-policy.js";

export const listUsuarios = () => prisma.usuario.findMany({
  select: { id: true, nombre: true, email: true, role: true, cargoId: true, activo: true, cargo: true, createdAt: true },
  orderBy: { nombre: "asc" }
});

export const createUsuario = async (input: { nombre: string; email: string; password: string; role: Role; cargoId?: number | null }) => {
  const passwordCheck = validatePassword(input.password);
  if (!passwordCheck.valid) {
    const error = new Error(passwordCheck.message);
    Object.assign(error, { statusCode: 400 });
    throw error;
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const usuario = await prisma.usuario.create({
    data: { nombre: input.nombre, email: input.email.toLowerCase().trim(), passwordHash, role: input.role, cargoId: input.cargoId ?? null },
    select: { id: true, nombre: true, email: true, role: true, cargoId: true, activo: true }
  });
  audit("USER_CREATED", { userId: usuario.id, email: usuario.email, role: usuario.role, cargoId: usuario.cargoId });
  return usuario;
};

export const patchUsuario = async (id: string, input: Partial<{ nombre: string; email: string; password: string; role: Role; cargoId: number | null; activo: boolean }>) => {
  const before = await prisma.usuario.findUnique({ where: { id }, select: { role: true, cargoId: true, activo: true } });
  if (input.password) {
    const passwordCheck = validatePassword(input.password);
    if (!passwordCheck.valid) {
      const error = new Error(passwordCheck.message);
      Object.assign(error, { statusCode: 400 });
      throw error;
    }
  }
  const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined;
  const usuario = await prisma.usuario.update({
    where: { id },
    data: {
      nombre: input.nombre,
      email: input.email?.toLowerCase().trim(),
      passwordHash,
      role: input.role,
      cargoId: input.cargoId,
      activo: input.activo
    },
    select: { id: true, nombre: true, email: true, role: true, cargoId: true, activo: true }
  });
  if (passwordHash) {
    await prisma.refreshSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    audit("PASSWORD_CHANGED", { userId: id });
  }
  if (before?.activo && usuario.activo === false) audit("USER_DISABLED", { userId: id });
  if (before && input.role && before.role !== input.role) audit("ROLE_CHANGED", { userId: id, from: before.role, to: input.role });
  if (before && "cargoId" in input && before.cargoId !== usuario.cargoId) audit("CARGO_CHANGED", { userId: id, from: before.cargoId, to: usuario.cargoId });
  return usuario;
};
