---
target: inicio (página principal pública)
total_score: 22
max_score: 32
na_heuristics: 5,7
p0_count: 0
p1_count: 0
target_identity: "file:/home/user/liga-aefpy-web/src/app/(public)/page.tsx"
target_fingerprint: "sha256:369ad5f7afc46f19f1087441fdedc7060c7caca082ab296cccc7138163859c1f"
target_path: /home/user/liga-aefpy-web/src/app/(public)/page.tsx
timestamp: 2026-10-24T22-10-41Z
slug: src-app-public-page-tsx
---
Method: dual-agent (A y B corrieron como dos sub-agentes aislados y en paralelo)

## Puntaje de salud de diseño

| # | Heurística | Puntaje | Hallazgo clave |
|---|-----------|-------|-----------------|
| 1 | Visibilidad del estado del sistema | 2 | Sin indicador de página activa en el menú |
| 2 | Coincidencia sistema / mundo real | 3 | Terminología futbolística estándar; columnas abreviadas (PJ/PG/DG) sin explicar |
| 3 | Control y libertad del usuario | 3 | El menú mobile cierra bien; no hay "volver arriba" en un scroll largo |
| 4 | Consistencia y estándares | 3 | Buen reuso de WidgetCard; un header con emoji y sliders con affordances distintas lo rompen |
| 5 | Prevención de errores | n/a | Página de solo lectura, sin formularios ni acciones destructivas |
| 6 | Reconocimiento antes que recuerdo | 3 | Escudos + etiquetas en todos lados; el menú de 10 ítems suma carga de memoria |
| 7 | Flexibilidad y eficiencia de uso | n/a | No hay tareas repetitivas/expertas en una superficie de tipo overview |
| 8 | Diseño estético y minimalista | 3 | Identidad de marca distintiva, debilitada por 3 franjas apiladas arriba de todo |
| 9 | Recuperación de errores | 3 | Existen componentes EmptyState para cada widget (verificado en código), no se vieron en vivo |
| 10 | Ayuda y documentación | 2 | Existe "Reglamento" pero es un link genérico; sin ayuda inline para la jerga/abreviaturas |
| **Total** | | **22/32** | **Aceptable (69%) — justo debajo del umbral de "Bueno"** |

## Veredicto de especificidad de diseño

**Evaluación cualitativa (Assessment A)**: en gran parte está pensado para este producto, no es una plantilla deportiva genérica. Evidencia: el wordmark en itálica con el acento rojo "2026", los cortes diagonales espejados en la tarjeta de video (un motivo real, no un default de Tailwind), y un sistema de tokens de modo oscuro con excepciones deliberadas y documentadas (los comentarios en `globals.css` explican por qué `navy-900` se invierte pero `red-600/700` se mantienen fijos en los botones). La única pieza que se siente como convención sin cuestionar: **el widget de clima de Asunción en InfoBar** — el clima físico no tiene relación con una liga de eFootball *online*; parece un resabio de plantillas de sitios de fútbol físico aplicado sin preguntarse si encaja con esta audiencia.

**Escaneo determinístico (Assessment B)**: `impeccable detect --json` sobre los 14 archivos de la página de inicio y sus componentes (page.tsx, layout.tsx, y los 12 componentes que renderiza) devolvió **0 hallazgos, exit code 0** — escaneo limpio. Dato interesante: Assessment A (sin ver el output de B) encontró de forma independiente un header con emoji ("🟨🟥") en `DisciplineWidget.tsx` — uno de los archivos escaneados — que el detector mecánico actual no capta con sus reglas. Es un caso concreto donde la revisión cualitativa encontró algo que el escaneo automático no.

**Overlay visual**: no se pudo ejecutar esta vez — esta sesión no tiene ninguna herramienta de automatización de navegador disponible (se confirmó con varias búsquedas de herramientas). El live-server de Impeccable arrancó bien, pero no hubo forma de inyectar el script `detect.js` en una pestaña real. No hay overlay visible para mostrar.

## Corrección post-síntesis (verificado tras el reporte original)

Dos hallazgos del reporte original no sobrevivieron la verificación y se retiran acá, en vez de borrarlos en silencio:

- **"Video roto" (antes [P1])**: leyendo `VideoPlayer.tsx` directamente, el componente SÍ maneja los casos reales — el iframe de YouTube/Twitch lleva `title` (a11y ok), y una URL no reconocible cae en una tarjeta de fallback temática con ícono y texto ("Ver video" / "Ver en [plataforma]"), no en un bloque negro vacío. El bloque sólido que se vio en las capturas de Assessment A fue confirmado como un efecto de que este sandbox bloquea la conexión saliente a `youtube.com` (mismo tipo de restricción que ya afectó al clima y a eFHUB en sesiones anteriores) — no un bug del código. Se retira de Problemas prioritarios.
- **Contradicción "Jornada 1 vs Jornada 6" (persona Riley)**: se generó con datos de prueba sembrados al azar para este critique (jornadas asignadas sin orden cronológico real), no con datos reales del sitio. No se puede confirmar como un hallazgo del producto sin volver a probarlo con datos reales — se marca como no verificado, no como hallazgo confirmado.

## Impresión general

El inicio tiene una identidad visual real y distintiva (wordmark, degradé navy/rojo, modo oscuro cuidado). Los problemas reales que quedan en pie son de jerarquía y carga cognitiva: tres franjas de header apiladas empujan el contenido real debajo del fold en mobile, y el menú de 10 ítems no orienta sobre dónde estás. La oportunidad más grande: aligerar ese encabezado apilado.

## Lo que funciona

- **Disciplina de tokens en modo oscuro**: todo el cambio de paleta se maneja con variables CSS con excepciones documentadas y deliberadas — poco común ver este nivel de rigor, y se sostiene visualmente en todos los widgets.
- **Sistema WidgetCard**: el header con degradé navy + chevron circular blanco se reusa consistentemente en 6 tarjetas, dándole a la página un sistema de diseño real en vez de secciones improvisadas.
- **Progressive disclosure en mobile**: `StandingsWidget` oculta columnas secundarias (PE/PP/GF/GC) debajo de `sm:`, manteniendo la tabla principal legible sin perder integridad de datos.

## Problemas prioritarios

**[P2] Tres franjas de header apiladas antes de cualquier contenido**
- **Qué**: InfoBar (ubicación/hora/clima) + TeamLogosBar (8 escudos) + PublicHeader (logo/menú de 10 ítems/CTAs) se renderizan como tres franjas horizontales separadas, empujando el título debajo del fold en mobile.
- **Por qué importa**: falla el chequeo de carga cognitiva de "foco único"; TeamLogosBar además es redundante con el slider de "Equipos" que ya está más abajo en esta misma página.
- **Arreglo**: sacar o colapsar TeamLogosBar específicamente en el inicio — duplica contenido que ya se muestra más abajo en el mismo scroll.
- **Comando sugerido**: `/impeccable layout`

**[P2] Menú plano de 10 ítems sin indicador de página activa**
- **Qué**: `PublicNav.tsx` lista 10 ítems de primer nivel; ni el menú de escritorio ni el de mobile marcan la página actual.
- **Por qué importa**: supera el límite recomendado de ≤5 ítems de primer nivel y elimina una señal básica de orientación.
- **Arreglo**: agrupar en menos categorías (ej. un grupo "Competición" para Fixture/Resultados/Posiciones/Goleadores/Disciplina) y agregar un estilo de estado activo.
- **Comando sugerido**: `/impeccable clarify`

**[P2] Los nombres de equipo se cortan en mobile en ResultsList**
- **Qué**: a 390px, `ResultsList` trunca nombres completos ("Sportivo A...", "Inter de Par...") junto a escudos sin etiqueta de 2-3 letras.
- **Por qué importa**: un visitante nuevo no puede identificar los equipos con confianza; `StandingsWidget` ya resuelve esto mismo usando `shortName`.
- **Arreglo**: usar `shortName` en anchos angostos en vez de truncar `name`.
- **Comando sugerido**: `/impeccable adapt`

**[P3] Header con emoji en el widget de Disciplina**
- **Qué**: `DisciplineWidget.tsx` usa el emoji "🟨🟥" como header de columna, el único emoji en un sistema por lo demás totalmente tipográfico/SVG.
- **Por qué importa**: se lee como un placeholder, no como craft terminado, y se renderiza distinto según SO/navegador.
- **Arreglo**: reemplazar por el patrón de badge que ya existe en el proyecto.
- **Comando sugerido**: `/impeccable polish`

## Alertas por persona

**Jordan (primera vez)**: aterriza en columnas abreviadas sin explicar (PJ/PG/PE/PP/GF/GC/DG) y escudos con códigos de equipo (MIL, SPO, TRI) sin leyenda ni tooltip — tiene que adivinar el significado de entrada. El video roto justo debajo del hero es lo primero que rompe confianza antes de que se haya formado alguna.

**Casey (mobile, distraída)**: los CTAs "Ingresar"/"Registrarme" viven solo en `hidden xl:flex` (confirmado ausentes del header en mobile) — quedan enterrados cerca del fondo de un menú hamburguesa de 10 ítems, lejos de la zona del pulgar. Los escudos de 28px de TeamLogosBar y el texto chico de InfoBar están arriba de todo, difíciles de tocar con una mano, y empujan el contenido real debajo del fold.

**Riley (que prueba los límites)**: no se encontraron banderas rojas verificadas para esta persona en esta corrida — ver la corrección arriba sobre el video y la contradicción de jornadas, ninguna sobrevivió la verificación con datos/red reales.

## Observaciones menores

- `UpcomingMatchesSlider` no tiene la barra de progreso de scroll que sí tiene `TeamsCardSlider` para el mismo patrón de interacción.
- El footer duplica los 10 links del menú principal tal cual, en vez de ofrecer contenido secundario curado (redes, contacto, historia).
- No hay affordance de "volver arriba" en una página tan larga.

## Preguntas para pensar

- Si un visitante tiene 10 segundos, ¿cuál es el único dato que este inicio debería dejarle — el líder de la tabla, la hora del próximo partido? Ahora mismo cinco tarjetas compiten por igual por ese momento.
- La franja de video es el único momento full-bleed y saturado en rojo de la página — ¿un estado roto/vacío es realmente el peor caso aceptable para tu momento visual más audaz?
- ¿Una liga de eFootball *online* necesita mostrar el clima físico de Asunción, o es una convención heredada de sitios de fútbol tradicional?
