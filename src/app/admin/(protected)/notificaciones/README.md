# Notificaciones AEFPY — implementación y despliegue

## Implementado en esta rama
- Bandeja persistente privada por usuario, lectura individual/masiva y contador.
- Eventos: sanciones manuales, aprobación de inscripción, creación/cambio de partidos, reclamos, traslado de defensa, resolución notificada, solicitud de revisión.
- Recordatorio de partido programado en las próximas 24 h, idempotente.
- Correo complementario por Resend con cuerpo genérico (sin pruebas ni datos sensibles).
- Endpoint POST protegido: /api/internal/notifications/send.
- La entrega en bandeja no equivale a lectura ni prueba acceso durante una caída. El correo enviado tampoco sustituye el traslado comprobado del Comité.

## Variables necesarias en Render
- RESEND_API_KEY: clave de envío.
- EMAIL_FROM: remitente de un dominio verificado en Resend.
- NOTIFICATION_JOB_SECRET: secreto aleatorio de al menos 32 bytes para el job.
No imprimir ni registrar valores secretos. No se crean ni se modifican automáticamente aquí.

## Puesta en marcha
1. npm ci; npx prisma validate; npx tsc --noEmit.
2. Revisar y aprobar PR, respaldar BD, desplegar migración: npm run db:deploy (DIRECT_URL requerida).
3. Verificar bandeja de dos delegados distintos y que no puedan ver notificaciones ajenas.
4. Configurar llamada POST periódica con Authorization: Bearer <NOTIFICATION_JOB_SECRET> desde un scheduler confiable. Sin scheduler no se envían correos ni recordatorios automáticamente.
5. Probar envío Resend, fallos, reintentos y accesibilidad de la bandeja.
6. Verificar funcionamiento con datos de prueba antes de habilitar en producción.

## Pendiente
- Conectar el resto de eventos deportivos (goles/tarjetas automáticas, sanciones reconciliadas, cierre de fechas, premios, tabla definitiva).
- Evitar múltiples envíos concurrentes del mismo correo con bloqueo/lease transaccional.
- Registro de webhook de entrega real de Resend y políticas de retención.
- Pruebas automáticas end-to-end y de concurrencia.

**No fusionar ni desplegar sin validar lo anterior.**
