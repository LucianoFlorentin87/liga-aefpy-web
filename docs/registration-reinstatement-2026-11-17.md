# Reincorporación sobre inscripción original — 17/11/2026

## Estado verificado (SELECT únicamente)
Pilcomayo FBC conserva la solicitud cmwknkw3e000n6r2afytriaj9 como APROBADA en la edición actual, pero teamId y userId están vacíos. No existe cuenta con su correo ni usuario. La edición está en INSCRIPCION, abierta hasta el cierre configurado. No se modificó esa solicitud ni se recrearon equipo/cuenta en producción durante el desarrollo.

## Comportamiento
Inscripciones distingue Aprobadas con equipo de Equipo eliminado. Una aprobación sin equipo ofrece Aprobar reincorporación, con confirmación explícita, solo durante inscripciones abiertas. Se reutiliza el mismo registro, nombre, correo y usuario; no se modifica su aprobación original, revisor, fecha ni nota. La acción autorizada para gestión de inscripciones registra el nuevo equipo/cuenta y actor en auditoría.

Se conserva la cuenta y contraseña existente si su identidad coincide exactamente (ignorando mayúsculas), es delegado activo y no administra otro equipo en la edición. Se rechazan identidades cruzadas, cuentas inactivas, roles ajenos y duplicados. Si la cuenta desapareció con la eliminación antigua, se crea una cuenta con contraseña aleatoria no divulgada: el delegado elige su contraseña por el flujo existente de recuperación por correo. No se envía correo automáticamente y no se expone contraseña ni token al administrador. El usuario se normaliza como requiere el login; la solicitud original conserva su escritura.

La transacción serializable bloquea la solicitud y coordina con el cambio de edición; repetir la acción no crea un segundo equipo. No permite restaurar solicitudes rechazadas/pendientes, equipos existentes, otras ediciones ni inscripciones cerradas. El administrador aprueba desde el botón; desplegar el código no reincorpora equipos automáticamente.

La eliminación futura separa los delegados de su equipo dentro de una transacción antes del DELETE para evitar el CASCADE heredado. Se conservan cuenta, inscripción y aceptación histórica; jugadores/partidos siguen bloqueando eliminación. El estado público del delegado informa Equipo eliminado y deja de mostrar el enlace engañoso al equipo inexistente.

## Validación y límites
45 tests aprobados: recuperación de cuenta borrada, conservación de aprobación y credenciales existentes, repetición, colisiones, rol/estado, equipo ya asignado, edición y cierre. Prueba PostgreSQL aislada en la cadena real de migraciones confirma conservación de usuario/solicitud/aceptación al separar y eliminar equipo. Lint global, TypeScript y build local se ejecutan antes de publicación.
No hay migraciones ni cambios de esquema. La recuperación requiere que el delegado pueda recibir correo en la dirección original y que el proveedor de correo esté operativo; el envío y cambio de contraseña no se ejecutan como prueba. Sigue pendiente la auditoría picomatch conocida.
