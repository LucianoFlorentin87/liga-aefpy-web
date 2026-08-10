import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "exafrutos_session";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

// Primera barrera (edge): bloquea el acceso directo a /admin/** sin una
// cookie de sesión válida. La verificación definitiva —usuario activo, rol
// habilitado para el recurso— se vuelve a hacer en cada página y cada server
// action contra la base de datos (ver src/lib/permissions.ts). Esta capa
// nunca es la única defensa.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secretKey = getSecretKey();

  if (!token || !secretKey) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, secretKey);
    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/admin/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
