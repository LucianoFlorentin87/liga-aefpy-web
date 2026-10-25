---
target: colores y botones (inicio público + panel admin)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/home/user/liga-aefpy-web/colores y botones (inicio público + panel admin)"
timestamp: 2026-10-25T16-03-25Z
slug: colores-y-botones-inicio-p-blico-panel-admin
---
**Method: dual-agent (A: revisión de diseño · B: detector + evidencia de navegador), ambos en subagentes aislados**

## Design Health Score

| # | Heurística | Puntaje | Hallazgo clave |
|---|---|---|---|
| 1 | Visibilidad del estado del sistema | 3 | Buen feedback en general (votación, log de actividad), pero en mobile la columna "Acciones" de /admin/equipos desaparece sin ningún indicio de que hay más contenido. |
| 2 | Coincidencia con el mundo real | 4 | Terminología de jornada/PJ-PG-PE-PP, walkover, formato es-PY — encaje de dominio correcto. |
| 3 | Control y libertad del usuario | 3 | `confirm()`/`alert()` nativos del navegador dan salida pero rompen el lenguaje visual del resto del producto. |
| 4 | Consistencia y estándares | 2 | Las CTA del header público nunca usan `.btn-primary/.btn-outline/.btn-ghost`; hay 3 tratamientos distintos de "botón rojo primario" en el sitio (ver Priority Issues). |
| 5 | Prevención de errores | 2 | "Retirar de la liga" (afecta toda la temporada) y "Eliminar" (borrado permanente) son el mismo pill rojo — ninguna gradación de riesgo. |
| 6 | Reconocimiento antes que recuerdo | 2 | 15 tarjetas de "Accesos rápidos" comparten sólo 3 íconos (por categoría, no por ítem) — el ícono no aporta pista real. |
| 7 | Flexibilidad y eficiencia | 2 | Sin acciones en lote (desactivar equipos, resolver sanciones) para el admin. |
| 8 | Diseño estético y minimalista | 3 | Buen ritmo de cards/tablas; el cluster de 3 CTAs del header con 3 estilos distintos agrega ruido evitable. |
| 9 | Recuperación de errores | 3 | Copy de los diálogos de confirmación inusualmente preciso y honesto sobre consecuencias. |
| 10 | Ayuda y documentación | 3 | Reglamento + copy verboso de confirmación compensan razonablemente la falta de ayuda contextual. |
| **Total** | | **27/40** | **Aceptable** |

## Veredicto de especificidad de diseño

**LLM**: el producto está mayormente anclado en el dominio real (Jornada/PJ-PG-PE-PP, copy de walkover, el mecanismo de revelar porcentajes de pronóstico recién después de votar en /fixture). Pero el propio código del sidebar de admin admite que la cabecera degradada y los grupos colapsables son "mismo patrón... de IT Tools, llevado a la paleta navy/rojo propia" — un patrón estructural tomado de una herramienta ajena y reskineado. La grilla de "Accesos rápidos" también diluye la especificidad en la práctica: 15 tarjetas comparten sólo 3 íconos por categoría, así que terminan leyéndose como placeholders genéricos en vez de un lanzador diseñado a medida.

**Escaneo determinístico**: `impeccable detect --json src/app src/components` corrió limpio — 0 hallazgos en 110 archivos .tsx. Es un escaneo AST/estático (colores hardcodeados, clases literales, anti-patrones estructurales) que no calcula contraste renderizado ni tamaños en píxeles reales, por eso no contradice lo que sigue: el detector corrido *en el navegador* (vía `live-server` + overlay inyectado) sobre las 5 páginas representativas encontró 57 hallazgos en inicio, 72 en fixture, 19 en posiciones, 20 en admin-dashboard y 6 en admin-equipos — sobre todo `low-contrast` y `undersized-ui-text`. Ningún falso positivo detectado: los contrastes más llamativos se verificaron a mano con la fórmula de luminancia sRGB y coinciden.

**Overlays visuales**: la inyección funcionó (ambos subagentes navegaron con Playwright headless y confirmaron el detector corriendo en la página real), pero corrió en una sesión de navegador aislada del subagente, no en una pestaña `[Human]` abierta en tu navegador ahora mismo. Lo que tengo son 20 capturas (5 páginas × desktop/mobile × claro/oscuro) que revisé directamente, más el JSON estructurado del overlay.

## Impresión general

El sistema de theming (variables CSS navy/rojo/gris con pares claro/oscuro) es genuinamente disciplinado y es la mayor fortaleza técnica del proyecto — pero esa disciplina se rompe justo donde el usuario pidió mirar: hay fallas de contraste AA reales y repetidas en texto rojo/gris de marca, tres variantes distintas de "botón primario rojo" sin un sistema compartido, y una tabla crítica de admin que en mobile esconde sus botones de acción (incluidos los destructivos) sin ningún indicio visual. La mayor oportunidad: consolidar todas las CTA rojas bajo `.btn-primary` y corregir los 4 puntos de contraste medidos antes de seguir agregando superficie nueva.

## Qué funciona bien

1. **Arquitectura de theming** en `globals.css`: una sola variable `:root`/`[data-theme=dark]` propaga de forma consistente por todo el proyecto, con excepciones documentadas en el propio código (navy-950 fijo como color de marca). Pensamiento de sistema poco genérico.
2. **Jerarquía danger/safe en `/admin/equipos`**: "Retirar de la liga" y "Eliminar" (pill roja rellena) se distinguen correctamente de "Editar"/"Desactivar" (texto ghost sin fondo) — la gradación de riesgo entre acción segura y peligrosa funciona bien en ambos temas.
3. **Mecánica de revelar el pronóstico recién después de votar** en `/fixture` (`PredictionWidget.tsx`) es una decisión de UX específica y bien pensada, ligada al propósito real del producto.
4. **Sistema de badges** (`badge-green/amber/navy/red`) pasa AA con margen en ambos temas (verde 4.74:1 claro / 7.92:1 oscuro; ámbar 5.28:1 / 7.85:1).

## Problemas prioritarios

**[P0] Columna "Acciones" de /admin/equipos inaccesible en mobile**
- Qué: a 390px de ancho, `.table-scroll` mide `scrollWidth: 553px` vs `clientWidth: 332px` — las columnas "Estado" y "Acciones" (Editar, Desactivar, Retirar de la liga, Eliminar) quedan fuera de pantalla por defecto, sin ningún fade/sombra/flecha que indique que hay más contenido. Medido de forma independiente por las dos evaluaciones, con los mismos números exactos.
- Por qué importa: los delegados (rol DELEGADO), que son quienes probablemente gestionan su equipo desde el celular, no tienen forma de descubrir que las acciones existen sin deslizar por accidente.
- Fix: agregar un fade/gradiente en el borde de `.table-scroll` (globals.css) que indique scroll horizontal, o convertir la columna Acciones en un menú de overflow por fila debajo de cierto ancho.
- Comando sugerido: `/impeccable adapt` sobre `TeamsManager.tsx` y `.table-scroll`.

**[P1] Fallas de contraste AA repetidas en texto rojo/gris sobre fondos de marca**
- Qué: 4 instancias concretas medidas — el link "Administración" del header (`#e0233a` sobre `#060f26` = 4.05:1, necesita 4.5:1; se repite en **todas** las páginas, claro y oscuro, porque `--color-red-500` nunca se redefine para dark mode); el eyebrow "ASOCIACIÓN DE EFOOTBALL PARAGUAY" del hero del inicio (`#c81729` sobre el degradado navy-800 = 2.4:1, casi ilegible); las etiquetas "Local/Empate/Visitante %" de la barra de pronóstico en /fixture (`#f6bdc4` sobre `#e0233a` = 2.9:1); y `--color-gray-400` reutilizado como texto secundario legible (códigos de equipo, "Online") a 2.6:1 sobre blanco, repetido 9+ veces.
- Por qué importa: son fallas reales de WCAG AA, visibles desde la primera pantalla que ve cualquier visitante (el hero del inicio) y en un link de navegación presente en todas las páginas.
- Fix: redefinir `--color-red-500` para dark mode o usarlo sólo sobre fondos claros; mover el eyebrow del hero a un fondo navy-950 plano (no el degradado) o aclarar el rojo ahí; oscurecer el rojo de fondo de la barra de pronóstico o aclarar más el texto de sus etiquetas; reemplazar `--color-gray-400` por `--color-gray-500` (4.83:1) en todo texto legible, reservando gray-400 para elementos puramente decorativos.
- Comando sugerido: `/impeccable audit` enfocado en contraste de color, o ajuste directo de tokens en `globals.css`.

**[P1] "Retirar de la liga" y "Eliminar" son visualmente indistinguibles pese a tener severidad muy distinta**
- Qué: ambos botones usan `.btn-danger` (mismo pill rojo relleno) en `TeamsManager.tsx` — uno fuerza walkovers 3-0 en toda la temporada, el otro borra el equipo de forma permanente. La única diferencia es el largo del texto.
- Por qué importa: un admin escaneando rápido la columna de acciones no tiene ninguna señal de color/peso que lo haga frenar antes de la acción más grave.
- Fix: reservar `.btn-danger` (relleno, alto contraste) sólo para lo irreversible ("Eliminar"), e introducir un nivel intermedio ("precaución", ej. ámbar/outline) para lo consecuente-pero-recuperable ("Retirar de la liga").
- Comando sugerido: ajuste directo en `globals.css` (nueva clase `.btn-caution`) y en `TeamsManager.tsx`.

**[P1] Tres variantes de "botón primario rojo" sin un sistema compartido**
- Qué: `.btn-primary` (rect, radio 8px, rojo plano) en el panel de admin; "Registrarme" del header público (`rounded-full`, rojo plano, markup Tailwind armado a mano, no usa `.btn-primary`); el submit del login de admin (`rounded-lg`, degradado `red-600→red-500`, tampoco usa la clase compartida). Las tres se leen como "la CTA roja de la marca" pero tienen forma y relleno distintos.
- Por qué importa: es justo el tipo de fuga que erosiona con el tiempo un sistema de theming por lo demás disciplinado; además el header público — la primera pantalla que ve casi todo visitante — es el que más se aparta del sistema.
- Fix: unificar las 3 variantes bajo `.btn-primary` (o documentar formalmente una variante "pill" si se la quiere mantener), y migrar `NextMatchCard.tsx` de `!text-red-300` a `text-[var(--color-red-300)]`.
- Comando sugerido: `/impeccable polish` sobre `PublicHeader.tsx` y `LoginForm.tsx`.

**[P2] Objetivos táctiles por debajo de 44px en los dos flujos más usados**
- Qué: medido con `getBoundingClientRect` — "Editar" 55×27px, "Desactivar" 89×27px, "Eliminar" 70×27px en /admin/equipos; los botones de voto "Gana local/Empate/Gana visitante" en /fixture también rondan 27px de alto. Además "Eliminar" (irreversible) queda a sólo 6px de "Desactivar" (reversible) en la misma fila.
- Por qué importa: por debajo de la recomendación de 44×44 de accesibilidad táctil, en las dos superficies de interacción más frecuentes del producto (votar en público, gestionar equipos en admin) — y el espaciado ajustado entre acciones de distinta severidad aumenta el riesgo de toque accidental.
- Fix: subir el padding vertical de `.btn` (hoy 0.55rem) o fijar `min-height: 44px` en controles interactivos a partir de mobile; aplicar lo mismo a los botones de voto de `PredictionWidget.tsx`.
- Comando sugerido: `/impeccable adapt`.

## Alertas por persona

**Jordan (primera visita, sitio público)**: en /fixture, los botones "Gana local / Empate / Gana visitante" tienen el mismo pill redondeado, mismo tamaño y mismo grosor de borde que los badges de estado ("Finalizado"/"Programado") dos filas más abajo — a primera vista se leen como el mismo *tipo* de elemento (etiquetas informativas), no como opciones tocables, lo que esconde el mecanismo central de participación de la página.

**Sam (usuario que depende de accesibilidad, panel admin)**: con lector de pantalla o poca visión, Sam llega a la tabla de Equipos y debe distinguir "Retirar de la liga" de "Eliminar" — ambos `.btn-danger`, sin ninguna diferencia salvo el texto — justo en el momento de ejecutar una acción grave pero no necesariamente permanente. La falta de un nivel de riesgo visual/semántico hace que un desliz ahí sea costoso.

**Alex (delegado gestionando desde el celular)**: abre /admin/equipos entre partidos y la columna Acciones — la razón entera de estar en esa página — está fuera de pantalla sin ninguna pista. Alex puede concluir que la función no existe en vez de que está escondida.

## Observaciones menores

- La grilla de `StatCard` del dashboard deja la tarjeta "Usuarios" (la 9ª) huérfana en la última fila a `lg:grid-cols-4` — no rompe nada, pero desbalancea visualmente.
- Las barras de encabezado de sección en modo oscuro ("JORNADA 1", "ÚLTIMOS RESULTADOS") usan `--color-navy-950` fijo, que mide apenas 1.10:1 contra el fondo de superficie oscuro — la jerarquía fuerte que se ve en modo claro casi desaparece en oscuro.
- La pantalla de login de admin (blobs animados, glassmorphism oscuro) es un lenguaje visual totalmente aparte del resto del panel (claro, plano) y no responde al toggle de tema — probablemente intencional, pero vale una decisión consciente en vez de que sea una deriva.
- La barra de probabilidad en /fixture usa rojo para "Visitante" — reutilizando el tono de marca/peligro para significar también "equipo visitante", una tercera carga semántica sobre el mismo rojo.
- `undersized-ui-text` fue el hallazgo más repetido del overlay: códigos de equipo en los crests ("MIL", "SPO", "CER"…) renderizan a 7.2–10.4px, por debajo del piso funcional de 11px; también las etiquetas de sección del sidebar de admin ("TORNEO", "ESTADÍSTICAS", "CONFIGURACIÓN") a 10.4px.

## Preguntas para pensar

1. Si "Eliminar" y "Retirar de la liga" hoy se ven idénticos, ¿qué pasa el día que un delegado retira al equipo equivocado a mitad de temporada y hay que explicar por qué tres meses de fixture se convirtieron en walkovers 3-0?
2. El sistema de variables CSS es claramente una inversión deliberada y disciplinada — ¿por qué el header público, la pantalla que ve casi todo visitante nuevo, es justamente el que no lo usa?
3. Con 15 tarjetas de "Accesos rápidos" compartiendo 3 íconos, ¿el ícono está aportando algo, o es relleno decorativo que podría reemplazarse por filas más densas con sólo texto?
