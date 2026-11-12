# Liga AEFPY — lista de control previa al despliegue

Estado: **NO APTO PARA FUSIÓN AUTOMÁTICA** hasta completar los controles.

## 1. Respaldo y reversión
- [ ] Confirmar último respaldo válido de PostgreSQL en Supabase y probar restauración aislada de datos críticos.
- [ ] Exportar/verificar esquema, migraciones aplicadas y recuentos de usuarios, partidos, votaciones y sanciones.
- [ ] Registrar commit y despliegue actual de Render; preparar procedimiento de rollback de código.
- [ ] Tener en cuenta que revertir código **no revierte migraciones**: las migraciones nuevas son aditivas y deben mantenerse compatibles.

## 2. Configuración de Render
- [ ] Confirmar `APP_URL=https://liga-aefpy-web.onrender.com` antes del despliegue.
- [ ] Verificar `SESSION_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `NOTIFICATION_JOB_SECRET` y variables de Supabase, sin exponer valores en logs.
- [ ] Confirmar que el comando de compilación ejecuta `prisma migrate deploy` **antes** de iniciar el código que usa nuevas columnas y tablas.
- [ ] Verificar que el cron de notificaciones está autenticado y que no existen jobs duplicados.

## 3. Migraciones pendientes en la rama
- `20261112200000_secure_trigger_search_path`: fija `search_path` en seis funciones trigger.
- `20261112210000_auth_attempt_limits`: crea tabla persistente de cuotas.
- `20261112220000_staff_session_revocation`: agrega `users.sessionVersion`.
- `20261112230000_notification_email_leases`: agrega `notifications.emailClaimedAt` y `emailAttempts`.
- [ ] Ejecutar `prisma migrate status` y verificar que no hay deriva o migraciones fallidas.
- [ ] Validar las cuatro migraciones en base aislada y ejecutar pruebas de reversibilidad operativa.

## 4. Pruebas funcionales obligatorias
- [ ] Login válido, contraseña incorrecta, bloqueo tras 12 intentos y desbloqueo tras ventana.
- [ ] Solicitudes de recuperación: 3/hora, mismo mensaje para correo existente e inexistente.
- [ ] Token de recuperación usado simultáneamente: una sola operación debe prosperar.
- [ ] Cambiar contraseña invalida todas las sesiones administrativas anteriores.
- [ ] Delegados y comité: permisos negativos, privacidad de votos y generación de PDF.
- [ ] Subida de imágenes/PDF válidos y rechazo de contenido incompatible con MIME.
- [ ] Exportaciones Excel: celdas que empiezan por =, +, -, @ y espacios previos.
- [ ] eFHUB: cuota, concurrencia, fallos externos, búsqueda con caracteres acentuados.
- [ ] Notificaciones: dos workers simultáneos, lease vencido, enfriamiento de cinco minutos tras fallo, cinco reintentos, fallo del proveedor.
- [ ] Revisar políticas del bucket público de Storage.

## Cobertura automatizada agregada
- Prueba de escape de fórmulas Excel: `tests/excel-safe.test.ts`.
- Prueba de firmas de archivos y MIME declarado: `tests/upload-signatures.test.ts`.
- GitHub Actions ejecuta `npm run test:security` además de Prisma, TypeScript, auditoría y build.
- **No sustituyen** las pruebas de integración con PostgreSQL y servicios externos.

## 5. Verificación posterior
- [ ] Confirmar Render `live` con nuevo SHA y migraciones exitosas.
- [ ] Comprobar endpoints críticos, logs y tasa de errores sin realizar acciones destructivas.
- [ ] Verificar Supabase Security Advisors y RLS de todas las tablas.
- [ ] Registrar fecha, responsable, evidencia y resultado; si falla un control, no declarar despliegue completado.

## Riesgos residuales
- La reserva de email no garantiza entrega exactamente una vez ante fallos entre proveedor y DB.
- La limitación de concurrencia eFHUB es local por instancia.
- Las firmas de archivos no sustituyen antivirus o decodificación completa.
- Bloqueo por usuario puede ser provocado por terceros; complementar con protección IP/WAF.
