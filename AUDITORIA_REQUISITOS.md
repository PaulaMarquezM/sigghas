# Auditoría de requisitos — SIGGHAS

Fuente: `Calidad_del_Software_Proyecto_Final1 (1).pdf`, revisada el 3 de agosto de 2026.

Estados: **Cumple** (evidencia en código y/o ejecución), **Parcial** (existe pero no cubre todo el requisito), **No cumple** (no hay implementación identificable) y **No verificable** (exige una prueba de carga, despliegue o recuperación no realizada).

## Hallazgos críticos

1. **RF03 no cumple:** no existe una validación que impida tener más de un coordinador activo.
2. **RF17 no cumple:** no hay modelo ni validación de horarios individuales para estudiantes con arrastre, repetición o convalidación.
3. **RF27 no cumple:** la generación solo permite seleccionar período; no permite generar por docente, curso, sede u otro criterio.
4. **Rol estudiante incompleto:** el usuario puede iniciar sesión, pero queda con un menú vacío y sin acceso a consulta. Además, `RolUsuario` ya no incluye `estudiante`, mientras los datos de prueba aún lo usan; esto hace fallar TypeScript.
5. **Publicación inconsistente:** el horario publicado `66716ad0-6383-47d2-8b88-b66b5a586713` aparece como “No válido” en el editor por `CONFIGURACION_INCOMPLETA`. Publicar no garantiza que el horario quede libre de errores críticos.
6. **RF33 parcial:** hay PDF de horarios, pero no reportes separados de carga docente, ocupación de aulas, disponibilidad y conflictos.
7. **Calidad técnica bloqueada:** `npx tsc --noEmit` falla con cuatro errores. Vitest sí pasa: 14/14 pruebas.

## Requisitos funcionales

| ID | Estado | Evidencia / observación |
|---|---|---|
| RF01 | Cumple | Inicio/cierre de sesión con Supabase, campos obligatorios y mensaje genérico de credenciales. |
| RF02 | Cumple | Roles en datos y ejecución: coordinador, docente, administrador, apoyo y estudiante legado. |
| RF03 | No cumple | No hay restricción de coordinador único en acciones, esquema o migraciones. |
| RF04 | Cumple | `requireRol`, RLS y navegación específica por rol. |
| RF05 | Cumple | CRUD de docentes incluye contrato, sede, carga y disponibilidad. |
| RF06 | Cumple | Campo `tipo_contrato` y formulario de docentes. |
| RF07 | Cumple | CRUD de materias. |
| RF08 | Cumple | CRUD de cursos (entidad interna `grupos`). |
| RF09 | Cumple | CRUD de aulas/laboratorios con capacidad, accesibilidad, sede y tipo. |
| RF10 | Cumple | CRUD de sedes. |
| RF11 | Cumple | Pantalla y grilla de disponibilidad docente. |
| RF12 | Cumple | Bloques de disponibilidad con `es_tiempo_oficina`. |
| RF13 | Cumple | Generador y editor validan disponibilidad docente. |
| RF14 | Cumple | Motor valida sede principal y asignación por sede. |
| RF15 | Cumple | Generador automático con backtracking. |
| RF16 | Cumple | Motor cubre disponibilidad, grupos, aulas, capacidad, modalidad y sedes. |
| RF17 | No cumple | No hay entidad de matrícula/estudiante ni lógica de arrastre/convalidación. |
| RF18 | Cumple | Presencial exige aula; el motor asigna aula física. |
| RF19 | Cumple | Virtual usa `espacio_id = null`. |
| RF20 | Cumple | Tabla `sesiones_grupos_compartidos` y lógica de sesiones compartidas. |
| RF21 | Cumple | Orden de prioridades y búsqueda de slots compatibles. |
| RF22 | Cumple | Editor manual permite mover, cambiar aula y agregar clase. |
| RF23 | Cumple | Validación local y de servidor al modificar/agregar. |
| RF24 | Cumple | Panel de conflictos y toasts visibles. |
| RF25 | Cumple | El editor bloquea acciones con conflicto crítico. |
| RF26 | Parcial | Hay confirmación para reemplazar borradores; no se confirma cada modificación manual. |
| RF27 | No cumple | UI de generación filtra únicamente por período. |
| RF28 | Cumple | Consulta por docente para coordinación y horario propio para docente. |
| RF29 | Parcial | Coordinador/admin puede consultar por curso; estudiante no recibe acceso desde UI. |
| RF30 | Cumple | Disponibilidad de aulas para coordinación y apoyo. |
| RF31 | Cumple | Grillas muestran materia, docente, curso, aula, modalidad y horas. |
| RF32 | Cumple | Rutas PDF para horario completo y horario docente/curso. |
| RF33 | Parcial | Solo reportes PDF de horario; faltan reportes específicos requeridos. |
| RF34 | Cumple | Roles, `requireRol` y RLS. |
| RF35 | Cumple | Inserciones en `historial_cambios` para crear, mover y publicar. |
| RF36 | Cumple | Historial almacena usuario, acción, detalle y fecha de creación. |
| RF37 | Parcial | Existen claves foráneas y validaciones; el horario publicado inválido demuestra una brecha operativa. |
| RF38 | Cumple | Administración central sobre Supabase para ambas sedes. |
| RF39 | Parcial | Base central compartida; no hay prueba de sincronización ni mecanismo independiente verificable. |
| RF40 | Cumple | El motor filtra aulas de la misma sede del curso. |

## Requisitos no funcionales

| ID | Estado | Evidencia / observación |
|---|---|---|
| RNF01 | Cumple | Interfaz con dashboard, formularios y mensajes claros. |
| RNF02 | Parcial | Navegación clara para cuatro roles; estudiante queda sin navegación. |
| RNF03 | Cumple | Horarios en grilla con detalle de sesiones. |
| RNF04 | Cumple | Panel de conflictos, estados y toasts. |
| RNF05 | Parcial | Hay etiquetas y controles semánticos básicos; falta auditoría formal de accesibilidad. |
| RNF06 | No verificable | No se midieron tiempos de respuesta con umbrales. |
| RNF07 | Cumple | Validación inmediata durante edición manual. |
| RNF08 | Parcial | Existe generador; falta medición de rendimiento con volumen real. |
| RNF09 | No verificable | No hay prueba de concurrencia. |
| RNF10 | Cumple | Supabase Auth, contraseña oculta y mensaje de error genérico. |
| RNF11 | Cumple | Rutas y acciones restringidas por rol. |
| RNF12 | Parcial | RLS y control de rol existen; falta revisión de seguridad/penetración. |
| RNF13 | Cumple | Auditoría de cambios implementada. |
| RNF14 | No verificable | Depende de hosting, monitoreo y SLA; no se revisaron. |
| RNF15 | Parcial | Restricciones y FKs; hay inconsistencia de horario publicado y errores de tipos. |
| RNF16 | Cumple | Validaciones previas bloquean conflictos críticos. |
| RNF17 | Parcial | Persistencia en Supabase; no hay evidencia de respaldo/recuperación. |
| RNF18 | Parcial | Modelo ampliable; no se hizo prueba de escalabilidad. |
| RNF19 | Cumple | Arquitectura separa UI, acciones, motor, PDF y persistencia. |
| RNF20 | Parcial | Cambios posibles vía código/migraciones, pero no hay configuración editable de reglas. |
| RNF21 | Parcial | Se verificó responsive móvil/escritorio; no varios navegadores/dispositivos. |
| RNF22 | Parcial | Rutas PDF y pruebas unitarias existen; falta inspección visual autenticada del archivo final. |
| RNF23 | Cumple | Sistema visual homogéneo y vocabulario Curso/Aula corregido. |
| RNF24 | Cumple | Motor y pruebas cubren reglas clave de disponibilidad y solapamiento. |
| RNF25 | Cumple | Información centralizada en Supabase. |
| RNF26 | Parcial | Filtros por curso/docente disponibles para coordinación; estudiante no puede consultar. |
| RNF27 | Cumple | Mensajes de formulario y conflictos son específicos. |
| RNF28 | Parcial | Confirmación para reemplazar borrador, no para todas las modificaciones críticas. |

## Verificación por rol (ejecución real)

| Rol | Resultado |
|---|---|
| Coordinador | Accede a generación, configuración, edición, consultas, entidades, disponibilidad, períodos y PDF. |
| Administrador | Accede a usuarios, períodos y sedes. No tiene módulos académicos ni de reportes en el menú. |
| Docente | Accede a “Mi Horario” y exportación PDF. |
| Apoyo | Accede a disponibilidad de aulas; las rutas de generación redirigen al dashboard. |
| Estudiante | Puede iniciar sesión, pero el menú y accesos rápidos quedan vacíos. |

## Validaciones ejecutadas

- Vitest: **14 pruebas aprobadas** en 5 archivos.
- TypeScript: **4 errores**: `NuevaSesionDialog.tsx`, `espacios/actions.ts`, `generar/actions.ts` y `UsuarioForm.tsx` (este último por el rol estudiante legado).
- Revisión responsive previa: portada sin desbordamiento a 390 px tras el ajuste realizado.

## Prioridad recomendada antes de entregar

1. Resolver los cuatro errores TypeScript y alinear migraciones, tipos y datos respecto a `estudiante`.
2. Decidir e implementar el flujo de estudiante o eliminar el rol y sus cuentas de prueba de manera consistente.
3. Impedir publicar un horario con errores críticos de configuración.
4. Implementar RF03, RF17, RF27 y los reportes faltantes de RF33, o ajustar el documento de requisitos si están fuera del alcance acordado.
5. Añadir confirmación a cambios manuales críticos y completar pruebas de carga, concurrencia, accesibilidad y PDF autenticado.
