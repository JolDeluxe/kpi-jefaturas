import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "../../db/index.js";
import { isRole } from "../../utils/cargo-scope.js";

const REFRESH_SESSION_DAYS = 30;

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

export const hashRefreshToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

const generateRefreshToken = () => crypto.randomBytes(48).toString("base64url");

const serializeUser = (user: {
  id: string;
  nombre: string;
  email: string;
  role: string;
  cargoId: number | null;
  cargo?: unknown;
}) => {
  if (!isRole(user.role)) return null;
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    role: user.role,
    cargoId: user.cargoId,
    cargo: user.cargo
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.usuario.findUnique({ where: { email: email.toLowerCase().trim() }, include: { cargo: true } });
  if (!user || !user.activo) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return serializeUser(user);
};

export const createRefreshSession = async (input: { userId: string; userAgent?: string; ip?: string }) => {
  const refreshToken = generateRefreshToken();
  const session = await prisma.refreshSession.create({
    data: {
      userId: input.userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: addDays(new Date(), REFRESH_SESSION_DAYS),
      userAgent: input.userAgent,
      ip: input.ip
    }
  });

  return { session, refreshToken };
};

export const rotateRefreshSession = async (refreshToken: string) => {
  const tokenHash = hashRefreshToken(refreshToken);
  const now = new Date();
  const currentSession = await prisma.refreshSession.findUnique({
    where: { tokenHash },
    include: { user: { include: { cargo: true } } }
  });

  if (!currentSession || currentSession.revokedAt || currentSession.expiresAt <= now || !currentSession.user.activo) {
    return null;
  }

  const user = serializeUser(currentSession.user);
  if (!user) return null;

  const nextRefreshToken = generateRefreshToken();
  const session = await prisma.refreshSession.update({
    where: { id: currentSession.id },
    data: {
      tokenHash: hashRefreshToken(nextRefreshToken),
      lastUsedAt: now,
      expiresAt: addDays(now, REFRESH_SESSION_DAYS)
    }
  });

  return { user, session, refreshToken: nextRefreshToken };
};

export const revokeRefreshSessionByToken = async (refreshToken?: string) => {
  if (!refreshToken) return;
  await prisma.refreshSession.updateMany({
    where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() }
  });
};

export const revokeAllRefreshSessions = async (userId: string) => {
  await prisma.refreshSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
};

export const getMe = async (id: string) => {
  const user = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nombre: true, email: true, role: true, cargoId: true, cargo: true, activo: true }
  });
  if (!user || !user.activo) return null;
  return user;
};
