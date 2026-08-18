@AGENTS.md

# Lecciones de layout/responsive (no repetir)

Estos son bugs concretos que aparecieron varias veces en distintos
componentes y ya se corrigieron — al tocar UI nueva o existente, tenerlos
en cuenta de entrada para no volver a pasar por el mismo ciclo de
prueba-error:

- **No usar breakpoints de viewport (`sm:`, `md:`, `lg:`) para decidir si
  algo va en fila o en columna cuando ese componente puede renderizarse
  dentro de un contenedor angosto** (ej. una `WidgetCard` de la mitad del
  ancho del inicio) **y también a lo ancho completo de una página**
  (`/resultados`, `/fixture`). Un `sm:flex-row` se activa según el ancho
  de la PANTALLA, no del contenedor real — en una tarjeta angosta con
  viewport grande, termina apretando todo igual. Default seguro: apilar
  en columna (`flex-col`) las partes que compiten por ancho (fila
  principal vs. meta info) y no depender de un breakpoint para eso.
- **Todo texto corto que no debe partirse a la mitad** (fechas, "Jornada
  N", marcadores tipo "1 - 4", badges) **necesita `whitespace-nowrap` +
  `shrink-0` explícitos.** Los flex children de Tailwind no lo tienen
  gratis: si el contenedor se achica, el texto se parte en dos líneas en
  medio de la frase en vez de mantenerse entero o pasar la fila completa
  a la siguiente línea.
- **`TeamCrest` usa `variant="clean"` (sin círculo) en TODOS lados, incluso
  sobre fondos oscuros (navy) — ej. `NextMatchCard`, el header de
  `/resultados/[id]`.** No hay excepción por defecto: el pedido explícito
  del usuario fue "sin ningún contenedor, que se vea fluido", igual en
  todos los apartados. Si un escudo puntual se pierde contra el fondo, usar
  el prop `shadow` (drop-shadow que sigue el contorno del escudo) antes que
  volver a `variant="circle"`. El respaldo de iniciales (equipo sin logo
  cargado) siempre se ve en círculo, sin importar la variante.
- **Orden ícono-antes-que-texto**: en cualquier fila con escudo + nombre
  de equipo, el escudo va SIEMPRE antes del nombre en el DOM (aunque el
  bloque esté alineado a la derecha) — nunca "nombre, después escudo".
- **Antes de dar por resuelto un ajuste visual, probarlo en los dos
  contextos reales**: la página completa (ancho total) Y una tarjeta
  angosta del inicio (`WidgetCard`, ~mitad del ancho) — la mayoría de
  estos bugs sólo aparecían en el segundo caso.
