# eFHUB: nombres rechazados — 17/11/2026

## Causa y corrección
El endpoint usaba una expresión regular con doble escape en las propiedades Unicode. Rechazaba nombres normales como del piero antes de consultar eFHUB, con HTTP 400 Búsqueda inválida. La validación ahora permite letras, marcas combinantes, números y puntuación de nombres; conserva longitud 2–80 y rechazo de controles/URLs/otros símbolos.

## Evidencia
- 39 tests aprobados, incluidos Del Piero, Neymar, Mbappé, tildes descompuestas, apóstrofos y guiones; límites y entradas inválidas.
- Lint global, TypeScript y build local webpack aprobados.
- Se ejecutó el handler real con autenticación y cuota ficticias (sin base productiva) usando Edge headless para consultar el sitio público de eFHUB. Resultado HTTP 200, 10 cartas de Alessandro Del Piero. Ejemplos: 17592186179086, 17592991485454, 17592454614542; nombre, posición SS, valoración e imagen disponibles.
- El navegador del usuario bloqueó dos veces la automatización por una ventana de otra extensión; no se considera verificado el formulario con su sesión. No se agregaron jugadores ni cartas a producción.
- Se mantienen permisos, cuota, caché, scraping y selección de carta. No hay migraciones.
- Sigue vigente el bloqueo conocido de auditoría de dependencias (picomatch) documentado en la revisión anterior; la autorización de publicación del usuario se mantiene en esta continuación.
