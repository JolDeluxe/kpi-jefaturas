import request from "supertest";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../src/index.js";
import { env } from "../src/env.js";
import { prisma } from "../src/db/index.js";

const testPassword = randomUUID();
const cargo302Email = "test-auth-cargo302@mbc.local";
const cargo200Email = "test-auth-cargo200@mbc.local";

describe("endpoints protegidos", () => {
  beforeAll(async () => {
    await prisma.cargo.upsert({ where: { id: 1 }, update: { nombre: "MBC", parentId: null, activo: true }, create: { id: 1, nombre: "MBC", parentId: null, activo: true } });
    await prisma.cargo.upsert({ where: { id: 200 }, update: { nombre: "GERENCIA ADMINISTRATIVA", parentId: 1, activo: true }, create: { id: 200, nombre: "GERENCIA ADMINISTRATIVA", parentId: 1, activo: true } });
    await prisma.cargo.upsert({ where: { id: 300 }, update: { nombre: "GERENCIA OPERATIVA", parentId: 1, activo: true }, create: { id: 300, nombre: "GERENCIA OPERATIVA", parentId: 1, activo: true } });
    await prisma.cargo.upsert({ where: { id: 302 }, update: { nombre: "JEFATURA DE PRODUCCION BOTAS II", parentId: 300, activo: true }, create: { id: 302, nombre: "JEFATURA DE PRODUCCION BOTAS II", parentId: 300, activo: true } });

    const passwordHash = await bcrypt.hash(testPassword, 12);
    await prisma.usuario.upsert({
      where: { email: cargo302Email },
      update: { passwordHash, role: "JEFE", cargoId: 302, activo: true },
      create: { nombre: "Auth Test Cargo 302", email: cargo302Email, passwordHash, role: "JEFE", cargoId: 302, activo: true }
    });
    await prisma.usuario.upsert({
      where: { email: cargo200Email },
      update: { passwordHash, role: "GERENTE", cargoId: 200, activo: true },
      create: { nombre: "Auth Test Cargo 200", email: cargo200Email, passwordHash, role: "GERENTE", cargoId: 200, activo: true }
    });
  });

  afterAll(async () => {
    const users = await prisma.usuario.findMany({ where: { email: { in: [cargo302Email, cargo200Email] } }, select: { id: true } });
    await prisma.refreshSession.deleteMany({ where: { userId: { in: users.map((user) => user.id) } } });
    await prisma.usuario.deleteMany({ where: { email: { in: [cargo302Email, cargo200Email] } } });
  });

  it("GET /api/auth/me sin sesion regresa 401", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });

  it("login emite access/refresh HttpOnly, refresh rota token y logout revoca", async () => {
    const agent = request.agent(app);

    const login = await agent
      .post("/api/auth/login")
      .send({ email: cargo302Email, password: testPassword });

    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe(cargo302Email);
    const loginCookies = login.headers["set-cookie"] as unknown as string[];
    const originalRefreshCookie = loginCookies.find((cookie) => cookie.startsWith(`${env.REFRESH_COOKIE_NAME}=`));
    expect(loginCookies.some((cookie) => cookie.startsWith(`${env.COOKIE_NAME}=`) && cookie.includes("HttpOnly"))).toBe(true);
    expect(loginCookies.some((cookie) => cookie.startsWith(`${env.REFRESH_COOKIE_NAME}=`) && cookie.includes("HttpOnly"))).toBe(true);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(cargo302Email);

    const refresh = await agent.post("/api/auth/refresh");
    expect(refresh.status).toBe(200);
    const refreshCookies = refresh.headers["set-cookie"] as unknown as string[];
    expect(refreshCookies.some((cookie) => cookie.startsWith(`${env.COOKIE_NAME}=`))).toBe(true);
    expect(refreshCookies.some((cookie) => cookie.startsWith(`${env.REFRESH_COOKIE_NAME}=`))).toBe(true);

    const replay = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", originalRefreshCookie || "");
    expect(replay.status).toBe(401);

    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(200);

    const afterLogout = await agent.get("/api/auth/me");
    expect(afterLogout.status).toBe(401);
  });

  it("login incorrecto usa mensaje generico", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "noexiste@mbc.local", password: "cualquiercosa" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Credenciales inválidas");
  });

  it("cargo fuera de scope regresa 403", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email: cargo200Email, password: testPassword });

    const response = await agent.get("/api/kpis").query({ cargoId: 300, anio: 2026, periodo: 1 });

    expect(response.status).toBe(403);
  });

  it("sync key incorrecta es rechazada", async () => {
    const response = await request(app)
      .post("/api/sync/kpis")
      .set("X-Sync-Key", "incorrecta");

    expect(response.status).toBe(401);
  });
});
