# Liga AEFPY

Sitio web completo de la **Liga AEFPY (Asociación de Efootball Paraguay)**.

Incluye sitio público (fixture, resultados, posiciones, goleadores, disciplina,
equipos, reglamento), cuentas públicas para que los hinchas voten quién creen
que gana cada partido, un perfil de autogestión para el delegado de cada
equipo, y un panel de administración privado con autenticación, roles y
permisos, para cargar todos los datos del torneo.

> **Sobre el logo:** se usa el logo oficial de la Liga AEFPY
> (`public/logo-exa-frutos.png`), consumido por el componente compartido
> `src/components/Logo.tsx` en header, footer, login, dashboard y favicon.

---

## 1. Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, TypeScript) |
| Estilos | Tailwind CSS v4 |
| Base de datos | Postgres (Prisma ORM) — Supabase en producción, ver sección 8 |
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
                        partidos, goles, tarjetas, sanciones, configuración,
                        cuentas de hinchas y predicciones)
  seed.ts               Crea los 4 roles fijos + configuración inicial del torneo
scripts/
  create-superadmin.ts  CLI para crear el primer Superadmin (sin password hardcodeada)
src/
  app/
    (public)/            Sitio público: /, /fixture, /resultados, /posiciones,
                          /goleadores, /disciplina, /equipos, /reglamento,
                          /cuenta/login, /cuenta/registro (cuentas de hinchas)
    admin/
      login/              /admin/login (no requiere sesión)
      (protected)/        Todo lo demás bajo /admin/**, protegido por sesión + rol
                          (incluye /admin/mi-equipo, exclusivo del DELEGADO)
    proxy.ts              Middleware: bloquea /admin/** sin cookie de sesión
                          válida, y confina al DELEGADO a su propio panel
  components/             UI del sitio público y del panel admin
  lib/
    auth.ts               Hash/verificación de contraseñas, sesión JWT (staff admin)
    fan-auth.ts            Sesión JWT independiente para cuentas públicas de hinchas
    permissions.ts         Matriz de permisos por rol + guards de servidor
    stats.ts               Cálculo de posiciones, goleadores y disciplina
    validation.ts           Esquemas zod
```

### Rutas públicas
`/`, `/fixture`, `/resultados`, `/resultados/[id]`, `/posiciones`,
`/goleadores`, `/disciplina`, `/equipos`, `/equipos/[id]`, `/videos`,
`/reglamento`, `/cuenta/login`, `/cuenta/registro`.

### Rutas del panel
`/admin/login`, `/admin/dashboard`, `/admin/usuarios`, `/admin/equipos`,
`/admin/jugadores`, `/admin/jugadores/[id]` (estadísticas), `/admin/partidos`
(incluye "Generar fixture automáticamente"), `/admin/partidos/[id]` (carga de
resultado/goles/tarjetas/convocados), `/admin/resultados`,
`/admin/goleadores`, `/admin/disciplina`, `/admin/sanciones`,
`/admin/ajustes-puntos`, `/admin/reglamento`, `/admin/videos`,
`/admin/configuracion`, `/admin/cuenta` (cambiar mi contraseña),
`/admin/mi-equipo` (sólo para el rol DELEGADO — ver sección 3).

### Textos del sitio editables

Nada de "Liga AEFPY" / "Asociación de Efootball Paraguay" está hardcodeado
en los componentes — todo sale de `TournamentSettings`
(`prisma/schema.prisma`) y se edita desde `/admin/configuracion`
(SUPERADMIN/ADMINISTRADOR):

- **`orgName`**: wordmark del logo (header, footer, login, panel) y
  título grande del inicio.
- **`orgTagline`**: bajada debajo del logo en el footer/login, línea roja
  arriba del título del inicio, y segunda mitad del copyright del footer.
- **`heroSubtitle`**: línea chica debajo del título grande del inicio.
- **`footerDescription`**: párrafo debajo del logo en el footer.

`src/components/Logo.tsx` recibe `name`/`tagline` como props (nunca los
tiene hardcodeados) — cada lugar que lo renderiza (`PublicHeader`,
`PublicFooter`, `AdminShell`, `admin/login`) hace su propia consulta a
`TournamentSettings` y se los pasa, porque `AdminShell` es un client
component y no puede leer la base de datos directamente.

### Reglamento oficial (Liga AEFPY)

El comportamiento de varias funciones sigue el reglamento oficial de la liga
(`Artículo 1`, `8`, `9` y `11`):

- **Fixture**: "Generar fixture automáticamente" en `/admin/partidos` arma
  todos-contra-todos ida y vuelta (método del círculo), una jornada nueva por
  semana. Sólo funciona si todavía no hay partidos cargados.
- **Suspensiones automáticas** (Art. 8): al cargar una tarjeta roja, o la
  3ª tarjeta amarilla acumulada de un mismo jugador, se crea sola una sanción
  de 1 partido en `/admin/sanciones`. La convocatoria de un partido muestra
  un aviso "Suspendido" si el jugador tiene una sanción activa (Art. 8.3) —
  es un aviso, no bloquea la carga, la decisión final queda en el admin.
- **Ajustes de puntos** (Art. 9 y 11): `/admin/ajustes-puntos` permite
  sumar o restar puntos manualmente a un equipo (ej. -1 por abandono de
  partido o por la "Regla Milán-Cherembo"). El ajuste se refleja
  automáticamente en la tabla de posiciones pública.
- **Reglamento en PDF**: desde `/admin/reglamento` se puede subir el PDF
  oficial, que se muestra embebido en `/reglamento` (con link para abrirlo
  aparte). Si no hay PDF, se usa el texto cargado como respaldo.

### Secciones del inicio inspiradas en LaLiga/Serie A

Tres widgets del inicio replican formatos de sitios de ligas reales,
adaptados a la paleta navy/rojo del sitio (nunca se copian sus colores
literales):

- **`UpcomingMatchesSlider`** ("Próximos partidos"): franja horizontal
  scrolleable de tarjetas (fecha corta, "Jornada N", escudos+equipos,
  hora) para los próximos partidos programados (`getUpcomingMatches()` en
  `src/lib/stats.ts`). Botón de flecha a la derecha hace scroll suave;
  en mobile se scrollea con el dedo directamente.
- **`StandingsWidget`** ("Tabla de posiciones" del inicio): versión
  compacta de la tabla completa — barra de título en navy con un botón
  circular que linkea a `/posiciones`, y sólo columnas Pos/Club/Pts/PJ/DG
  (la tabla completa con todas las columnas sigue en `StandingsTable`,
  usada en `/posiciones`).
- **`TeamsCardSlider`** ("Equipos" del inicio): tarjetas con escudo +
  nombre corto, mismo patrón de slider con flecha, cada una linkea a
  `/equipos/[id]`.

### Visor de videos

Desde `/admin/videos` (SUPERADMIN/ADMINISTRADOR) se carga un título y un
link — no se sube ningún archivo de video. Todos se publican en `/videos`,
pero el inicio **no** los muestra automáticamente: sólo los marcados a
mano como **"Destacado"** (checkbox del formulario, o el botón rápido
"Destacar"/"Quitar de destacados" en la lista — `Video.featured`), y con
un único criterio simple:

- El destacado **más reciente** se ve **grande**, arriba de todo en el
  inicio, antes de "Últimos resultados/Tabla de posiciones" — pensado
  para el partido más relevante del momento.
- El **resto** de los destacados (si hay más de uno) van en una franja
  más chica, más abajo, entre "Tabla de posiciones" y "Máximos
  goleadores" (hasta 6, en 3 columnas).

No hay un segundo marcador para elegir "cuál es el grande": ni bien
destacás un video nuevo, automáticamente pasa a ser el que se ve grande, y
el que estaba antes baja a la franja chica.

El video destacado se muestra sobre un bloque rojo a todo el ancho, con
las esquinas del video cortadas en diagonal (`clip-path` inline en
`src/app/(public)/page.tsx`) — estética tomada de LaLiga.com.

### Franja de escudos

`src/components/TeamLogosBar.tsx` (montado en `src/app/(public)/layout.tsx`,
arriba del header) muestra los escudos de todos los equipos activos en una
fila blanca horizontal —scrolleable si no entran— arriba de todo en cada
página pública, cada uno linkeando a `/equipos/[id]`. También inspirado en
la franja de clubes de LaLiga.com.

El componente `src/components/VideoPlayer.tsx` reconoce la plataforma a
partir de la URL (`src/lib/video.ts`):

- **YouTube**: se embebe directo (`watch?v=`, `youtu.be/`, `/live/`, `/shorts/`).
- **Twitch**: se embebe un canal en vivo (`twitch.tv/canal`) o un VOD
  (`twitch.tv/videos/123`). El embed de Twitch exige declarar el dominio
  exacto donde corre la página (`parent=`), que sólo se conoce en el
  navegador — se resuelve con `useSyncExternalStore` (nunca `window` del
  lado del servidor).
- **Cualquier otra plataforma** (o un link que no se pudo reconocer): se
  muestra como un botón "Ver video" que abre el link original en una
  pestaña nueva, sin intentar embeberlo.

### Predicciones de los hinchas

Cualquier visitante puede crear una cuenta pública en `/cuenta/registro`
(nombre, apellido, correo y contraseña — completamente separada de las
cuentas del panel admin: cookie, JWT y tabla propias, `fan_users`) y, ya
logueado, votar en `/fixture` quién cree que gana cada partido programado
(`Gana local` / `Empate` / `Gana visitante`). El voto:

- sólo está disponible para partidos en estado `PROGRAMADO` o
  `REPROGRAMADO` (se oculta una vez que el partido se juega),
- es una predicción del hincha, **nunca** el resultado oficial del partido
  (eso lo sigue cargando el staff en `/admin/partidos/[id]`),
- se puede cambiar en cualquier momento antes del partido (upsert por
  usuario + partido), y el widget muestra el porcentaje de votos de cada
  opción en tiempo real.

Un usuario con rol `DELEGADO` **también** puede votar, usando su misma
cuenta del panel (`/admin/login`) — no necesita crear además una cuenta de
hincha. `src/lib/voter.ts` centraliza esa identidad ("¿quién puede votar
ahora?": una `FanUser` o un `User` con rol DELEGADO) y `Prediction` guarda
el voto contra `fanUserId` o `staffUserId` según corresponda (nunca ambos).
Ningún otro rol de staff (SUPERADMIN, ADMINISTRADOR, CARGA_DATOS) vota con
su cuenta de staff.

### Delegado de equipo

El rol `DELEGADO` es una cuenta del panel (creada por un SUPERADMIN en
`/admin/usuarios`, con un equipo asignado) pensada para que cada equipo
autogestione su propia información sin tocar nada del resto de la liga:

- Al loguearse entra directo a `/admin/mi-equipo` — no ve el resto del
  menú del panel (`src/lib/admin-nav.ts`), y si intenta entrar a cualquier
  otra URL de `/admin/**` por la barra de direcciones, `src/proxy.ts` lo
  redirige de vuelta.
- Ahí puede editar el **nombre y la abreviatura** de su equipo, el
  delegado/contacto, teléfono, correo, cancha (`Team.homeVenue`), gamertag
  / ID de plataforma (PSN, Xbox Live, EA ID), redes/streaming (Instagram,
  Facebook, YouTube, Twitch, Discord, TikTok) y el logo de **su propio
  equipo**, y cargar/editar/activar/desactivar **sus propios jugadores** —
  todo server-side scoped al `teamId` guardado en su usuario
  (`requireDelegate()` en `src/lib/permissions.ts`), nunca a un `teamId`
  que venga del formulario. El SUPERADMIN/ADMINISTRADOR puede editar los
  mismos campos de contacto/redes desde `/admin/equipos` para cualquier
  equipo. Las redes/streaming se muestran como links en la ficha pública
  del equipo (`/equipos/[id]`, componente `src/components/SocialLinks.tsx`);
  el correo del delegado es sólo un dato de contacto por ahora, no habilita
  todavía un "olvidé mi contraseña" automático.
- **No puede** cargar resultados, goles ni tarjetas de ningún partido — esa
  parte del panel (`/admin/partidos`, `/admin/resultados`, etc.) sigue
  siendo exclusiva de SUPERADMIN/ADMINISTRADOR/CARGA_DATOS.
- Con esa misma cuenta también puede votar las predicciones en `/fixture`
  (ver "Predicciones de los hinchas" más arriba) — no necesita además una
  cuenta de hincha aparte.

Para crear de una sola vez un usuario Delegado por cada equipo activo que
todavía no tenga uno (en vez de ir uno por uno en `/admin/usuarios`), corré
desde tu computadora, con `DATABASE_URL`/`DIRECT_URL` de producción en el
`.env`:

```bash
npm run create:delegates
```

Genera un usuario (`delegado.<abreviatura-del-equipo>`) y una contraseña
temporal al azar por cada equipo sin delegado, y los imprime en la consola
**una sola vez** — no quedan guardados en texto plano en ningún lado (sólo
el hash), así que copiá la lista antes de cerrar la terminal para
repartirla. Es seguro correrlo de nuevo más adelante: a los equipos que ya
tienen un delegado no los toca.

### Exportar equipos y delegados a Excel

Desde `/admin/usuarios` (sólo SUPERADMIN), el botón **"Descargar Excel
(equipos y delegados)"** genera y descarga un `.xlsx` con todos los
equipos: nombre, abreviatura, delegado/teléfono/cancha cargados en
`/admin/equipos`, y los datos de su cuenta DELEGADO. Por cada equipo:

- Si **ya tiene** una cuenta DELEGADO: usuario y correo reales, si está
  activa y su último ingreso. La contraseña se muestra como "—" porque se
  guarda hasheada y no se puede recuperar (para cambiarla, "Restablecer
  clave" en `/admin/usuarios`).
- Si **todavía no tiene** cuenta: la fila queda resaltada en amarillo con
  un usuario y una contraseña **sugeridos** (mismo criterio que `npm run
  create:delegates`: `delegado.<abreviatura>` + contraseña al azar) — no
  se crea nada en la base, es sólo una propuesta para cargarla a mano en
  `/admin/usuarios`, o corriendo `npm run create:delegates` (que crea
  exactamente esas mismas cuentas sugeridas).

Lo genera `src/app/admin/(protected)/usuarios/export/route.ts` con
`exceljs`, reutilizando `src/lib/delegate-suggestions.ts` para las
sugerencias.

---

## 3. Roles y permisos

| Recurso | SUPERADMIN | ADMINISTRADOR | CARGA_DATOS | DELEGADO |
|---|:---:|:---:|:---:|:---:|
| Usuarios | ✅ | ❌ | ❌ | ❌ |
| Equipos / Jugadores / Partidos (programación) | ✅ | ✅ | ❌ | ❌ |
| Resultados / Goles / Tarjetas (partidos ya cargados) | ✅ | ✅ | ✅ | ❌ |
| Sanciones / Reglamento / Videos / Configuración | ✅ | ✅ | ❌ | ❌ |
| Mi equipo (`/admin/mi-equipo`: sólo el equipo propio) | ❌ | ❌ | ❌ | ✅ |

La matriz vive en un solo lugar (`src/lib/permissions.ts`) y se usa tanto
para armar el menú lateral como para autorizar cada server action — el
mismo chequeo corre siempre en el servidor, así que entrar a una URL de
forma directa sin permiso redirige igual, con o sin JavaScript.
`/admin/mi-equipo` no forma parte de esa matriz por recurso (no es un
recurso administrativo genérico: es el equipo propio del usuario) — tiene
su propio guard, `requireDelegate()`.

Reglas adicionales aplicadas en el servidor:
- Sólo un SUPERADMIN puede asignar el rol SUPERADMIN.
- No se puede desactivar ni eliminar al único Superadmin activo del sistema.
- Nadie puede desactivarse ni eliminarse a sí mismo desde `/admin/usuarios`.

---

## 4. Instalación y desarrollo local

Requisitos: Node.js 20+ y una base Postgres accesible (la misma de Supabase
sirve para desarrollar, o una instancia Postgres propia/local).

```bash
npm install
cp .env.example .env
# Editá .env: pegá tu DATABASE_URL de Postgres y generá tu propio SESSION_SECRET:
openssl rand -base64 48

npm run db:migrate     # aplica el esquema (crea las tablas)
npm run db:seed        # crea los 4 roles fijos + configuración inicial

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
(`/admin/usuarios`) y creá cuentas con rol `ADMINISTRADOR`, `CARGA_DATOS` o
`DELEGADO`. Al elegir `DELEGADO` el formulario pide además el equipo al que
queda asociado ese usuario (ver sección 3). Cada usuario nuevo se crea con
una contraseña temporal; el sistema marca la cuenta para que la cambie en
`/admin/cuenta` (esa pantalla la tiene disponible cualquier usuario
logueado, para su propia cuenta).

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

## 8. Despliegue (Render + Supabase)

### 8.1 Base de datos: Supabase

1. Creá una cuenta en [supabase.com](https://supabase.com) → "New Project".
2. Cuando esté listo, click en **"Connect"** (arriba) → pestaña **"ORM"** →
   elegí **Prisma**. Te da dos variables ya armadas — copiá ambas (con tu
   contraseña puesta en lugar de `[YOUR-PASSWORD]`):
   - `DATABASE_URL` → pooler en modo transacción (puerto 6543), la usa la
     app en runtime.
   - `DIRECT_URL` → pooler en modo sesión (puerto 5432), la usa Prisma sólo
     para migraciones.

   (La conexión "directa" de Supabase usa IPv6 por defecto y muchas redes no
   la alcanzan — por eso el proyecto usa el pooler para las dos.)

### 8.2 Hosting: Render

1. Creá una cuenta en [render.com](https://render.com) y conectá tu GitHub.
2. "New" → "Web Service" → elegís el repo `torneo-exa-frutos`.
3. Configuración del servicio:
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: Free (o el que prefieras)
4. En "Environment Variables" agregá las variables de Supabase de los
   pasos anteriores (`DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`,
   `SUPABASE_SECRET_KEY` — ver sección "Subida de archivos" más abajo) más:
   - `SESSION_SECRET` → un valor generado con `openssl rand -base64 48`
   - `NODE_ENV` → `production`
5. "Create Web Service". Cada deploy aplica las migraciones y vuelve a
   sembrar los roles/configuración inicial automáticamente (el seed es
   idempotente, no duplica nada si ya existían).
6. Una vez desplegado, creá el primer Superadmin corriendo **desde tu propia
   computadora** (no desde Render, que no da terminal gratis):
   ```bash
   git clone https://github.com/LucianoFlorentin87/torneo-exa-frutos.git
   cd torneo-exa-frutos && npm install
   # pegá DATABASE_URL y DIRECT_URL (las mismas de Supabase) en un archivo .env
   npm run create:superadmin
   ```

Render te da una URL pública del tipo `https://torneo-exa-frutos.onrender.com`
apenas termine el deploy.

### Subida de archivos (logos de equipos y PDF del reglamento)

El logo de cada equipo y el PDF del reglamento se suben a un bucket público
de **Supabase Storage** llamado `uploads` (ver `src/lib/supabase-admin.ts` y
`src/lib/upload.ts`) — no al filesystem del servidor. Esto es necesario
porque en el plan free de Render el disco **no es persistente**: se pierde
en cada deploy y cada vez que la instancia se "duerme" por inactividad y
vuelve a levantar.

Para que la subida de archivos funcione:

1. En Supabase: **Storage → New bucket** → nombre `uploads` → activar
   **Public bucket**.
2. **Project Settings → API Keys** → copiar la clave **`secret`** (o
   `service_role` en proyectos más viejos) — nunca la `anon`/`publishable`,
   esa es la que sí se expone al navegador.
3. Variables de entorno (local y en Render): `SUPABASE_URL` (la URL del
   proyecto, `https://<project-ref>.supabase.co`) y `SUPABASE_SECRET_KEY`
   (la clave del paso anterior).

Si preferís no depender de Supabase Storage, la alternativa es un
[Persistent Disk](https://render.com/docs/disks) de Render montado en
`public/uploads`, adaptando `uploadToStorage()` para escribir a disco de
nuevo — pero no es necesario, Supabase Storage entra en la capa gratuita.

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
npm run create:delegates   # crear un usuario Delegado por cada equipo sin uno
```
