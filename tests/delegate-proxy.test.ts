import assert from "node:assert/strict";
import { test } from "node:test";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";

const secret = "aefpy-test-only-regulation-routing-key";
const cookieName = "aefpy_session";

async function requestAsDelegate(path: string) {
  process.env.SESSION_SECRET = secret;
  const token = await new SignJWT({ sub: "test-delegate", role: "DELEGADO", sessionVersion: 1 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
  return new NextRequest(new URL(path, "https://liga.example"), {
    headers: { cookie: `${cookieName}=${token}` },
  });
}

test("delegate can access the regulation acceptance page without being sent back to Mi equipo", async () => {
  const response = await proxy(await requestAsDelegate("/admin/aceptar-reglamento"));
  assert.equal(response.headers.get("location"), null);
});

test("delegate can access own team and inbox while administrator pages remain blocked", async () => {
  for (const allowed of ["/admin/mi-equipo", "/admin/notificaciones", "/admin/comite", "/admin/cuenta"]) {
    const response = await proxy(await requestAsDelegate(allowed));
    assert.equal(response.headers.get("location"), null, allowed);
  }
  for (const blocked of ["/admin/reglamento", "/admin/usuarios", "/admin/equipos"]) {
    const response = await proxy(await requestAsDelegate(blocked));
    assert.equal(response.headers.get("location"), "https://liga.example/admin/mi-equipo", blocked);
  }
});
