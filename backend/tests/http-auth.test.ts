import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/index.js";
import { env } from "../src/env.js";

describe("endpoints protegidos", () => {
  it("GET /api/auth/me sin sesion regresa 401", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });

  it("login emite access/refresh HttpOnly, refresh rota token y logout revoca", async () => {
    const agent = request.agent(app);

    const login = await agent
      .post("/api/auth/login")
      .send({ email: "cargo302@mbc.local", password: "KpiDev123!" });

    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe("cargo302@mbc.local");
    const loginCookies = login.headers["set-cookie"] as unknown as string[];
    const originalRefreshCookie = loginCookies.find((cookie) => cookie.startsWith(`${env.REFRESH_COOKIE_NAME}=`));
    expect(loginCookies.some((cookie) => cookie.startsWith(`${env.COOKIE_NAME}=`) && cookie.includes("HttpOnly"))).toBe(true);
    expect(loginCookies.some((cookie) => cookie.startsWith(`${env.REFRESH_COOKIE_NAME}=`) && cookie.includes("HttpOnly"))).toBe(true);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("cargo302@mbc.local");

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
    await agent.post("/api/auth/login").send({ email: "cargo200@mbc.local", password: "KpiDev123!" });

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
