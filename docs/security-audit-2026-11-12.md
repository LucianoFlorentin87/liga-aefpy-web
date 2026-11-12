# Auditoría de seguridad de Liga AEFPY — 12/11/2026

**Alcance:** revisión estática de código de la rama `feature/delegate-notification-inbox`, flujos de autenticación, permisos, archivos, rutas, comité, exportaciones, notificaciones, configuración y migraciones; verificación automatizada de dependencias y compilación. **No equivale a pentest ni prueba de producción**. No se inspeccionaron secretos reales, configuración efectiva de Supabase/Render, políticas efectivas de Storage ni tráfico autenticado por roles.

## Hallazgos

| ID | Severidad | Estado | Evidencia y riesgo | Acción |
|---|---|---|---|---|
| SEC-01 | Alta | Corregido en rama; pendiente configurar APP_URL | `src/app/admin/recuperar-contrasena/actions.ts`: el enlace de recuperación se formaba con `Host` y `x-forwarded-proto` del request; riesgo de envenenamiento del enlace. | Usar origen canónico `APP_URL` con HTTPS. Configurarlo en Render antes de desplegar. |
| SEC-02 | Alta | Corregido en rama | `src/lib/upload.ts`: aceptaba SVG en un bucket público. Los SVG pueden contener contenido activo y causar XSS cuando se sirven directamente. | Limitar a PNG/JPEG/WEBP. Verificar contenido real/magic bytes y configuración de Content-Type en Storage en siguiente fase. |
| SEC-03 | Verificado | Sin exposición confirmada | Consulta directa a Supabase: las 30 tablas de `public` tienen RLS activo, cero políticas; tablas nuevas sin privilegios `anon`/`authenticated`. El diseño usa Prisma en backend. | Mantener revisión continua de grants, RLS y Storage; no añadir políticas públicas innecesarias. |
| SEC-04 | Alta | Corregido en rama; pendiente migración y pruebas | `src/app/admin/login/actions.ts` no tiene limitación de intentos, bloqueo progresivo ni protección centralizada ante fuerza bruta. | Rate limit distribuido por IP y cuenta, logs y alertas; probar intentos repetidos. |
| SEC-05 | Media/Alta | Corregido parcialmente en rama; pendiente pruebas | `src/app/admin/recuperar-contrasena/actions.ts` permite solicitudes repetidas sin cuota, y verifica `usedAt` antes de actualizar sin condición atómica; una carrera concurrente puede reutilizar el mismo token. | Limitar solicitudes y consumir token atómicamente; invalidar sesiones existentes tras cambio de contraseña. |
| SEC-06 | Media | Corregido para staff en rama; pendiente integración | `src/lib/auth.ts` verifica usuario activo y rol, pero no revoca JWT ya emitidos cuando cambia la contraseña. Duración 8 h; sesiones de hincha duran 30 días. | Agregar `sessionVersion`/fecha de revocación y verificarla al autorizar. |
| SEC-07 | Media | Corregido en rama; pendiente pruebas | `src/app/admin/(protected)/jugadores/efhub-search/route.ts` lanza Chromium por búsquedas de usuario autenticado, sin cuota por usuario ni límite de concurrencia, y devuelve detalles de excepción. | Rate limit, concurrencia máxima, límite de longitud de consulta y errores genéricos. |
| SEC-08 | Media | Mitigado en rama; pendiente pruebas | `src/lib/notifications.ts`: workers concurrentes pueden enviar el mismo correo; `emailError` no impide reintentos ilimitados. | Claim transaccional/lease, backoff y límite de intentos. |
| SEC-09 | Media | Pendiente | `src/lib/league-rate-limit.ts`: mapa en memoria, no compartido entre instancias y clave tomada de `x-forwarded-for`; el límite es eludible dependiendo del proxy. | Límite distribuido y dirección IP normalizada desde infraestructura confiable. |
| SEC-10 | Media | Corregido en rama; pendiente pruebas | `src/app/admin/(protected)/auditoria/export/route.ts` y `usuarios/export/route.ts` escriben campos controlados por usuarios en Excel sin neutralización explícita de fórmulas. | Escapar prefijos `=,+,-,@` y controles antes de exportar. |
| SEC-11 | Media | Pendiente | `src/lib/email.ts` insertaba nombre del usuario en HTML sin escape. | Se agregó escape HTML en la rama; revisar el resto de plantillas. |
| SEC-12 | Media | Pendiente de pruebas dinámicas | Permisos del comité tienen lógica compleja en `src/lib/committee.ts`; hay controles por usuario, equipo y conflicto de interés, pero no se ejecutaron pruebas de matriz multiusuario y concurrencia. | Pruebas negativas por roles, pertenencia de equipo, acceso a expedientes y voto secreto. |

## Comprobación directa de Supabase (12/11/2026)
- Proyecto `liga-aefpy-web`, consulta SQL de solo lectura: 30/30 tablas de `public` con RLS activo; ninguna política registrada.
- El asesor de seguridad confirma RLS sin políticas (informativo, compatible con backend Prisma); detectó **6 funciones de trigger con search_path mutable**.
- Se agregó migración `20261112200000_secure_trigger_search_path` para fijar `public, pg_temp`; **aún no aplicada en producción**.
- Fuente: Supabase Security Advisors, `function_search_path_mutable`: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- La revisión no equivale a prueba de acceso por HTTP con claves públicas ni a auditoría de Storage.

## Correcciones de autenticación preparadas (12/11/2026)
- `src/lib/auth-rate-limit.ts`: contador atómico y persistente en PostgreSQL, clave HMAC no reversible con `SESSION_SECRET`.
- `src/app/admin/login/actions.ts`: hasta 12 intentos por usuario/15 minutos, limpieza tras login válido. Riesgo residual: bloqueo temporal de cuentas por terceros; añadir límite IP de infraestructura confiable/WAF como defensa complementaria.
- `src/app/admin/recuperar-contrasena/actions.ts`: hasta 3 solicitudes por correo/hora, sin revelar existencia de cuenta; consumo atómico del token de recuperación.
- Migración nueva `20261112210000_auth_attempt_limits` pendiente de ejecutar en producción. **No desplegar el código de login sin esta migración.**
- Faltan pruebas de integración con Postgres, concurrencia y experiencia de usuario.

## Revocación de sesiones administrativas (12/11/2026)
- `users.sessionVersion` nuevo campo (migración `20261112220000_staff_session_revocation`).
- El login firma el contador de sesión en JWT; `requireActiveUser` lo compara con PostgreSQL en cada operación protegida.
- El restablecimiento de contraseña por correo o desde administración incrementa el contador, invalidando sesiones anteriores.
- Requiere ejecutar migración **antes** de desplegar código. Sesiones antiguas sin `sessionVersion` exigirán iniciar sesión de nuevo.
- Pendiente prueba dinámica de revocación y revisión separada de sesiones de hinchas.

## Endurecimiento de archivos y exportaciones (12/11/2026)
- `src/lib/upload.ts`: valida cabeceras PNG/JPEG/WEBP y PDF además del MIME y tamaño; no se aceptan SVG. Es una verificación de firma, **no** una inspección antivirus ni una decodificación completa de contenido.
- `src/lib/excel-safe.ts`: protege valores textuales que comienzan con caracteres interpretables como fórmula, incluyendo prefijos de espacios o controles.
- `auditoria/export` y `usuarios/export`: aplican escape a campos de usuarios, equipos y bitácora.
- Pendientes: pruebas con archivos malformados y muestras de fórmulas, revisión de políticas de Storage.

## eFHUB y entrega de notificaciones (12/11/2026)
- eFHUB: cuota persistente de 30 búsquedas por usuario/hora, dos scrapes concurrentes por instancia, validación de consulta y límite de caché; errores internos no se exponen al cliente.
- Notificaciones: reclamo atómico por fila con `updateMany`, lease de 5 minutos y máximo cinco intentos. Migración `20261112230000_notification_email_leases` pendiente de aplicar.
- **Limitación:** si Resend acepta el correo y falla la confirmación en PostgreSQL, aún podría reenviarse después de expirar el lease. Se requiere deduplicación del proveedor o reconciliación para garantizar no duplicación estricta.
- El límite de concurrencia eFHUB es por instancia; la cuota por usuario se comparte en PostgreSQL.
- Pendientes pruebas de concurrencia, expiración, errores de proveedor y carga en Render.

## Controles positivos observados
- `src/lib/auth.ts`: cookies `httpOnly`, `sameSite=lax`, `secure` en producción; JWT con expiración; revalidación de usuario activo y rol en base de datos.
- `src/lib/permissions.ts`: matriz de permisos aplicada a operaciones sensibles.
- `src/app/api/internal/notifications/send/route.ts`: cron exige secreto por encabezado Bearer.
- `src/app/admin/(protected)/notificaciones/actions.ts`: las actualizaciones de lectura están restringidas por `recipientId`.
- Prisma usa consultas parametrizadas en las rutas inspeccionadas.
- `npm audit` sobre el lockfile confirmado en CI: **0 vulnerabilidades conocidas**; Prisma validate, TypeScript, ESLint de módulos modificados y build aprobados en ejecución #23 (antes de los cambios de esta auditoría).

## Validaciones obligatorias antes de producción
1. Configurar `APP_URL=https://liga-aefpy-web.onrender.com` en Render.
2. Revisar RLS/grants en todas las tablas nuevas y permisos de Supabase Storage.
3. Probar recuperación de contraseñas, login por fuerza bruta, roles, comité y aislamiento entre equipos.
4. Revisar secretos, rotación, backups y restauración en Render/Supabase.
5. Confirmar encabezados CSP/HSTS, cookies y CORS en la instancia real.
6. Volver a correr CI tras los cambios y desplegar únicamente con pruebas aprobadas.

**Dictamen:** Dependencias sin avisos conocidos; **seguridad integral NO certificada**. Mantener despliegue bloqueado hasta cerrar SEC-04, aplicar/verificar el endurecimiento de funciones y validar configuración real, validar configuración real y ejecutar pruebas dinámicas.
