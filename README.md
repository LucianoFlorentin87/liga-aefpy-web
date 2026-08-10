# Torneo Exa Frutos

Sitio web completo del **Torneo de Fútbol de Exalumnos del Colegio Nacional Juan
Manuel Frutos**, organizado por la **Asociación de Exalumnos Exa Frutos**.

Incluye sitio público (fixture, resultados, posiciones, goleadores, disciplina,
equipos, reglamento) y un panel de administración privado con autenticación,
roles y permisos, para cargar todos los datos del torneo.

> **Sobre el logo:** no se recibió el archivo del logo oficial de la
> asociación. `src/components/Logo.tsx` dibuja un monograma provisorio
> ("EF") en la paleta azul marino / rojo / blanco / gris — es el único lugar
> del código que hay que tocar para reemplazarlo por el logo real (ver
> comentario en ese archivo). El sitio **no** usa el escudo del Colegio
> Nacional Juan Manuel Frutos en ningún lado.

---

## 1. Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, TypeScript) |
| Estilos | Tailwind CSS v4 |
| Base de datos | SQLite en desarrollo (Prisma ORM) — ver sección 8 para producción |
| Autenticación | Sesión propia con JWT firmado (`jose`) en cookie `httpOnly`, contraseñas con `bcrypt` |
| Validación | `zod` en todos los formularios y server actions |

No es una maqueta: todo el contenido público sale de la base de datos, hay
CRUD real para cada entidad, autenticación con contraseñas hasheadas, sesiones
con expiración, y los permisos se validan en el servidor (no solo ocultando
botones).

---

## 2. Estructura del proyecto

```
prisma/
  schema.prisma        Modelo de datos (usuarios, roles, equipos, jugadores,
                        partidos, goles, tarjetas, sanciones, configuración)
  seed.ts               Crea los 3 roles fijos + configuración inicial del torneo
scripts/
  create-superadmin.ts  CLI para crear el primer Superadmin (sin password hardcodeada)
src/
  app/
    (public)/            Sitio público: /, /fixture, /resultados, /posiciones,
                          /goleadores, /disciplina, /equipos, /reglamento
    admin/
      login/              /admin/login (no requiere sesión)
      (protected)/        Todo lo demás bajo /admin/**, protegido por sesión + rol
    proxy.ts              Middleware: bloquea /admin/** sin cookie de sesión válida
  components/             UI del sitio público y del panel admin
  lib/
    auth.ts               Hash/verificación de contraseñas, sesión JWT
    permissions.ts         Matriz de permisos por rol + guards de servidor
    stats.ts               Cálculo de posiciones, goleadores y disciplina
    validation.ts           Esquemas zod
```

### Rutas públicas
`/`, `/fixture`, `/resultados`, `/resultados/[id]`, `/posiciones`,
`/goleadores`, `/disciplina`, `/equipos`, `/equipos/[id]`, `/reglamento`.

### Rutas del panel
`/admin/login`, `/admin/dashboard`, `/admin/usuarios`, `/admin/equipos`,
`/admin/jugadores`, `/admin/jugadores/[id]` (estadísticas), `/admin/partidos`,
`/admin/partidos/[id]` (carga de resultado/goles/tarjetas/convocados),
`/admin/resultados`, `/admin/goleadores`, `/admin/disciplina`,
`/admin/sanciones`, `/admin/reglamento`, `/admin/configuracion`,
`/admin/cuenta` (cambiar mi contraseña).

---

## 3. Roles y permisos

| Recurso | SUPERADMIN | ADMINISTRADOR | CARGA_DATOS |
|---|:---:|:---:|:---:|
| Usuarios | ✅ | ❌ | ❌ |
| Equipos / Jugadores / Partidos (programación) | ✅ | ✅ | ❌ |
| Resultados / Goles / Tarjetas (partidos ya cargados) | ✅ | ✅ | ✅ |
| Sanciones / Reglamento / Configuración | ✅ | ✅ | ❌ |

La matriz vive en un solo lugar (`src/lib/permissions.ts`) y se usa tanto
para armar el menú lateral como para autorizar cada server action — el
mismo chequeo corre siempre en el servidor, así que entrar a una URL de
forma directa sin permiso redirige igual, con o sin JavaScript.

Reglas adicionales aplicadas en el servidor:
- Sólo un SUPERADMIN puede asignar el rol SUPERADMIN.
- No se puede desactivar ni eliminar al único Superadmin activo del sistema.
- Nadie puede desactivarse ni eliminarse a sí mismo desde `/admin/usuarios`.

---

## 4. Instalación y desarrollo local

Requisitos: Node.js 20+.

```bash
npm install
cp .env.example .env
# Editá .env y generá tu propio SESSION_SECRET:
openssl rand -base64 48

npm run db:migrate     # crea prisma/dev.db y aplica el esquema
npm run db:seed        # crea los 3 roles fijos + configuración inicial

npm run create:superadmin   # crea tu primer usuario Superadmin (ver sección 5)

npm run dev             # http://localhost:3000
```

## 5. Crear el primer Superadmin

No hay ninguna contraseña fija en el código. El primer Superadmin se crea con
un script de línea de comandos:

```bash
npm run create:superadmin
```

Te va a pedir nombre, apellido, correo, usuario y una contraseña (mínimo 8
caracteres). También podés pasarlo todo por variables de entorno (útil para
scripts/CI):

```bash
SUPERADMIN_FIRST_NAME="Ana" SUPERADMIN_LAST_NAME="Pérez" \
SUPERADMIN_EMAIL="ana@example.com" SUPERADMIN_USERNAME="ana.perez" \
SUPERADMIN_PASSWORD="una-contraseña-segura" \
npm run create:superadmin
```

Con eso ya podés entrar en `/admin/login`.

## 6. Crear más usuarios

Una vez logueado como Superadmin, andá a **Configuración → Usuarios**
(`/admin/usuarios`) y creá cuentas con rol `ADMINISTRADOR` o `CARGA_DATOS`.
Cada usuario nuevo se crea con una contraseña temporal; el sistema marca la
cuenta para que la cambie en `/admin/cuenta` (esa pantalla la tiene
disponible cualquier usuario logueado, para su propia cuenta).

## 7. Cargar equipos, jugadores y partidos

Orden recomendado (cada paso depende del anterior):

1. **Torneo → Equipos**: creá los equipos (nombre, abreviatura, delegado,
   logo opcional). El sitio público no muestra nada hasta que haya al menos
   un equipo activo.
2. **Torneo → Jugadores**: cargá el plantel de cada equipo.
3. **Torneo → Partidos**: programá los partidos (jornada, fecha, hora,
   cancha, equipos, estado).
4. **Torneo → Resultados** (o el botón "Ver / cargar resultado" desde
   Partidos): abrí un partido y ahí podés
   - marcar los **convocados** de cada equipo (y quién fue titular),
   - cargar cada **gol** (minuto + jugador) — el marcador y el resto de las
     estadísticas (goleadores, tabla de posiciones, disciplina) se calculan
     solos a partir de estos goles, nunca se cargan "a mano",
   - cargar cada **tarjeta** (amarilla/roja, minuto, jugador, observación),
   - cambiar el **estado** del partido a "Finalizado" cuando termine.
5. **Estadísticas → Sanciones**: si corresponde, registrá una sanción para
   un jugador (motivo, cantidad de partidos, vigencia).
6. **Configuración → Reglamento** y **Configuración → Configuración del
   torneo**: reglamento del torneo y criterio de desempate de la tabla de
   posiciones (por defecto Puntos → Diferencia de gol → Goles a favor).

Todo lo que carga el panel se refleja automáticamente en el sitio público:
no hay ningún dato escrito a mano en el HTML.

---

## 8. Base de datos en producción

En desarrollo la app usa **SQLite** (`prisma/dev.db`), un archivo local — no
requiere instalar ni configurar ningún servidor de base de datos aparte.

Esto **no alcanza para producción** si el hosting es serverless (Vercel,
Netlify Functions, etc.): esas plataformas ejecutan cada request en una
función con filesystem efímero, así que un archivo SQLite no persiste entre
invocaciones. Para producción:

1. Contratá una base Postgres administrada (opciones con capa gratuita:
   [Neon](https://neon.tech), [Supabase](https://supabase.com),
   [Railway](https://railway.app)).
2. En `prisma/schema.prisma` cambiá:
   ```prisma
   datasource db {
     provider = "postgresql"   // antes: "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
3. Seteá `DATABASE_URL` con la cadena de conexión de Postgres en las
   variables de entorno del hosting.
4. Corré `npx prisma migrate deploy` contra esa base (una sola vez, o como
   paso de tu pipeline de deploy).
5. Corré `npm run create:superadmin` apuntando a esa `DATABASE_URL` para
   crear el primer usuario en producción.

El resto del código no depende del motor de base de datos — es un cambio de
configuración, no de arquitectura.

### Subida de archivos (logos de equipos) en producción

El logo de cada equipo se guarda en el filesystem local
(`public/uploads/teams`, ver `src/lib/upload.ts`). Igual que con SQLite, esto
funciona en desarrollo y en hosting tradicional (una VM/Node persistente),
pero **no persiste en una función serverless**. Para producción serverless,
reemplazá `saveTeamLogo()` por una subida a un bucket de almacenamiento
(S3, Cloudflare R2, Vercel Blob, etc.) y guardá la URL pública resultante en
`Team.logoUrl` — el resto del sitio (tarjetas de equipo, plantel) ya
consume `logoUrl` tal cual, sin cambios adicionales.

---

## 9. Seguridad implementada

- Contraseñas hasheadas con `bcrypt` (nunca en texto plano ni en el código).
- Sesión firmada con JWT (`jose`), cookie `httpOnly`, `sameSite=lax`,
  `secure` en producción, expiración a las 8 horas.
- `src/proxy.ts` (middleware) bloquea cualquier acceso directo a `/admin/**`
  sin cookie de sesión válida — primera barrera, corre en el servidor.
- Cada página y cada server action del panel vuelve a validar la sesión
  contra la base de datos (usuario activo) **y** el permiso sobre ese
  recurso puntual (`requirePermission` en `src/lib/permissions.ts`) — la UI
  oculta botones que el rol no puede usar, pero eso es sólo cosmético: el
  bloqueo real está del lado del servidor.
- Ningún secreto (contraseñas, `SESSION_SECRET`) está en el código fuente ni
  se expone al cliente; todo sale de variables de entorno (`.env`, nunca
  commiteado).
- Los formularios validan con `zod` tanto en cliente como en servidor.

---

## 10. Comandos disponibles

```bash
npm run dev              # servidor de desarrollo
npm run build            # build de producción
npm run start             # servir el build de producción
npm run lint               # ESLint
npm run db:migrate         # crear/aplicar migraciones en desarrollo
npm run db:deploy          # aplicar migraciones existentes (producción)
npm run db:seed            # crear roles fijos + configuración inicial
npm run db:studio          # explorador visual de la base (Prisma Studio)
npm run create:superadmin  # crear un usuario Superadmin
```
