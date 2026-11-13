# Identidad visual AEFPY — contrato de interfaz

Aplicar a **todas** las pantallas públicas, administrativas, formularios, modales, estados vacíos, errores, acceso y mantenimiento. No crear un color o estilo local para un elemento que ya tenga un componente equivalente.

## Fuente de verdad
- `src/app/globals.css`: variables, `.league-site`, `.admin-arena`, `.btn`, `.btn-primary`, `.btn-outline`, `.btn-ghost`, `.btn-danger`, `.btn-caution`, `.input`, `.field-label`, `.card`, `.badge-*`.
- `src/components/Logo.tsx`: escudo institucional, proporciones, nombre y leyenda.
- `src/components/admin/Modal.tsx`: ventanas de edición.
- Verde lima primario del panel: `#D1FF3B`; hover `#E0FF82`; texto sobre verde `#101512`. **No** reemplazar con verde genérico (`green-600`) ni botones navy.
- No confundir identidad con semántica: acciones destructivas, errores, advertencias y estados pueden usar sus variantes oficiales, no el verde primario.
- Modo oscuro y claro deben utilizar variables de tema y mantener contraste; no introducir fondos claros fijos en pantallas oscuras.
- Formularios: `input` + `field-label`; acciones: `btn` + variante oficial; tarjetas: `card`; mensajes: `field-error` o `badge-*`.

## Lista obligatoria de revisión para cada cambio
1. Comparar con otra pantalla equivalente del mismo sitio antes de agregar clases.
2. Revisar estados normal, hover, focus, disabled, loading y error.
3. Comprobar escritorio y móvil, sin desbordamiento, con navegación de teclado.
4. Comprobar tema claro/oscuro.
5. Comprobar logo, tipografía, radio, espaciado, jerarquía y contraste.
6. Revisar modal, confirmación, alertas, listas vacías y mantenimiento cuando aplique.
7. Ejecutar `npm run test:security`, TypeScript, lint y build; las pruebas de código no sustituyen inspección visual real.
8. No publicar en producción hasta CI aprobado y autorización de despliegue.

## Alcance de la auditoría del 13/11/2026
Se revisaron por código las páginas públicas principales y las secciones administrativas, además de formularios, modales, cabecera, bandeja y mantenimiento. Se corrigieron desviaciones concretas en reglamento, comité, notificaciones, cabecera pública y mantenimiento. La inspección interactiva de todas las rutas y estados, incluida activación real del mantenimiento, **queda pendiente** y no se considera cubierta por las pruebas estáticas.
