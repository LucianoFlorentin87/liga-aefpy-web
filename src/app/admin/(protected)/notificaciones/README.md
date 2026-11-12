# Notificaciones AEFPY — implementación por etapas

La bandeja es privada por destinatario y guarda una fila por comunicación. La entrega al panel se registra al crear la fila; readAt no equivale a entrega. sourceKey evita duplicados en reintentos.

## Eventos previstos
INSCRIPCION: recepción, aprobación, rechazo, renovación.
CALENDARIO: publicación, apertura, cambios, recordatorios y cierre.
RESULTADO: reporte, corrección, confirmación, anulación.
DISCIPLINA: amarillas, rojas, sanción creada/modificada/cumplida.
RECLAMO: recepción, traslado, prueba nueva, vencimientos, defensa.
COMITE: asignación, resolución, revisión, firmeza.
TORNEO: temporada, reglamento, tabla definitiva, campeón.
PREMIO: solicitud de datos, entrega, incidencia.
COMUNICADO: anuncios oficiales.

## Integración actual
- Bandeja persistente y navegación del delegado.
- Alta manual de sanción notifica al delegado del equipo.
- El resto de eventos requiere conectar los puntos de escritura correspondientes.
- Correo pendiente: implementar cola de envío y seguimiento de entrega antes de usarlo para notificaciones con efecto reglamentario.
- La existencia de una fila no acredita que el usuario haya podido acceder a la plataforma durante una caída; conservar canal alternativo.
- No se debe considerar una sanción automáticamente exigible sin verificar el procedimiento de notificación vigente.
