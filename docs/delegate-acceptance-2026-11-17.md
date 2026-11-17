# Mi equipo y aceptación — evidencia 17/11/2026

## Diagnóstico
- Base de partida: main 2afb87a (PR #25); Render Live dep-dbu8k5rbc2fs739rfqp0, 14:10 Paraguay.
- proxy.ts ya permite aceptar-reglamento desde PR #24. No persiste el antiguo bucle.
- requireDelegate exige usuario activo, rol delegado, equipo de edición actual y aceptación de la publicación vigente. Las acciones de Mi equipo llaman este guard antes de escribir. eFHUB tiene autorización independiente y sigue accesible al delegado.
- Consulta SELECT en Supabase liga-aefpy-web: usuario luciano ACTIVO / DELEGADO, equipo Milan, edición AEFPY Clausura 2026, cero aceptaciones, cero jugadores y escudo sin cargar. Publicación vigente 1.3, efectiva 13/11/2026 09:50:11 Paraguay; corresponde a la misma edición del equipo.
- La redirección es el requisito vigente, pero faltaba explicar por qué y el formulario quedaba debajo del PDF. Ahora se comunica el motivo y se usa ancho completo con PDF y aceptación en columnas desde 1280px; en móvil se apilan. Se conservan diseño, eFHUB, escudo y jugadores.
- La acción de aceptación conserva casilla voluntaria obligatoria, publicación exacta, revalidación de actor/equipo/edición dentro de transacción serializable y retorno fijo a Mi equipo. No se agregó retorno arbitrario.
- Logs de aplicación consultados desde el último Live: sin errores en esa ventana. Los errores ENOTFOUND recuperados inicialmente pertenecen al 11/11 y no prueban fallo actual.

## Validación local
- npm ci: 0 vulnerabilidades.
- 37 tests de seguridad aprobados; TypeScript aprobado.
- Lint global aprobado después de corregir avisos previos de estado inicial en LiveClock/ThemeToggle y configurar CommonJS para scripts .cjs.
- Build webpack aprobado, todas las rutas generadas. Build habitual Turbopack falla localmente al iniciar proceso PostCSS en Windows; primer intento restringido falló además por descarga de fuentes. CI Linux debe validar el build habitual antes de fusionar.
- Inspección de la página real renderizada con datos ficticios y CSS compilado: 1892x950 oscuro, 1440x900 claro, 390x844 oscuro; sin desbordamiento y casilla desmarcada. El marco de navegación es una fixture simplificada y el iframe queda vacío en esta inspección: no equivale a sesión autenticada ni a lectura del PDF en producción.

## Límites y pendientes
- La captura del usuario muestra portada PDF v1.2 mientras el registro publicado exige v1.3. Se conserva URL y SHA-256 e81a042a50e23dd5354944e5fd3cc599c60b94943932ccf3880f7fd3cfdb0968. Resolver la coherencia editorial requiere revisión del documento por el responsable; no se cambia publicación ni aceptaciones.
- No se escribió en Supabase, no se ejecutaron migraciones, no se aceptó reglamento ni se usaron credenciales del delegado. La prueba autenticada de aceptar y abrir el equipo requiere la aceptación personal del usuario.
- No hay archivo de contexto maestro en este checkout; se recuperó la conversación referenciada y el contrato visual docs/aefpy-visual-design-contract.md.

## Resultado de publicación
- PR preparado: https://github.com/LucianoFlorentin87/liga-aefpy-web/pull/26
- CI https://github.com/LucianoFlorentin87/liga-aefpy-web/actions/runs/44136471811 falló en el bloqueo de dependencias conocidas (14 entradas transitivas por picomatch <=4.0.7, GHSA-fc5q-39xc-vjpf). Tests, TypeScript y build de CI quedaron omitidos por ese fallo temprano; sus resultados locales se conservan arriba.
- npm view picomatch version devolvió 4.0.7 el 17/11/2026; no se encontró versión posterior publicada. No se degradó Next.js ni se desactivó el control para forzar la publicación. El resultado local de 0 vulnerabilidades no reproduce el resultado del registro usado por CI y no se considera prueba suficiente para publicar.
- No fusionado, no desplegado. Render conserva 2afb87a; healthz 200 y rutas mi-equipo, aceptar-reglamento y jugadores/efhub-search responden 307 hacia admin/login sin sesión.
- Pendiente: resolver dependencia afectada con una versión corregida verificable, repetir CI y después publicar/verificar Render Live. La comprobación autenticada y aceptación voluntaria siguen pendientes del usuario.
