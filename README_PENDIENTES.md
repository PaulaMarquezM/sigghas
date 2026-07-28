# SIGGHAS — Entrega al equipo y pendientes

Este documento resume los cambios realizados el **28 de julio de 2026**, lo que debe verificarse antes de presentar el sistema y las tareas que todavía pueden repartirse entre los integrantes del equipo.

## Qué se corrigió

### Interfaz y vocabulario

- La entidad visible **Grupos** pasó a llamarse **Cursos**.
- La entidad visible **Espacios** pasó a llamarse **Aulas**.
- Se conservaron internamente las rutas `/grupos`, `/espacios` y las tablas `grupos`, `espacios` para evitar una migración destructiva de base de datos.
- Se aumentó el tamaño base de la tipografía.
- Las tarjetas de acceso rápido ahora tienen una apariencia distinta a los botones de acción.
- Se agregaron skeletons para la carga global y la navegación dentro del dashboard.

### Formularios y mensajes

- Los campos obligatorios ahora se identifican con `*`.
- Los campos opcionales se muestran como `(opcional)`.
- Los errores de formularios y horarios usan mensajes más claros y visibles.
- El código de una materia dejó de ser obligatorio. Si no se escribe, SIGGHAS genera uno interno automáticamente.
- En los horarios se muestra principalmente el **nombre de la materia**, no su código.

### Cursos, materias y aulas

- Las aulas se crean ingresando únicamente su número. Ejemplo: `204` se guarda como `Aula 204`.
- Un aula nueva obtiene disponibilidad inicial de lunes a viernes, de `08:00` a `17:00`.
- La configuración del horario ahora sigue el orden:
  1. semestre;
  2. materia;
  3. curso;
  4. docente.
- Los desplegables fueron reorganizados para evitar que sus textos se monten.

### Generación y edición de horarios

- El flujo de generación automática explica los pasos y los errores de configuración.
- Se agregó la opción **Crear manualmente** para iniciar un borrador vacío.
- El editor permite agregar una clase seleccionando semestre, curso, materia, docente, aula, día y hora.
- Las nuevas clases se validan antes de guardarse.
- Los horarios publicados pueden seguir editándose por coordinadores y administradores.
- Los movimientos y nuevas clases continúan registrándose en el historial de cambios.

### Reportes PDF

- La generación cambió de streams de Node a buffers compatibles con los Route Handlers de Next.js.
- La búsqueda del período activo ahora toma el más reciente y no falla cuando existen varios registros activos.
- Se agregó control de autorización para descargar reportes por curso.
- Los PDFs muestran nombres de materias y la palabra **Curso**.

### Base de datos

- Se corrigió una colisión de versiones entre migraciones `010`.
- Se agregó una migración nueva y no destructiva para permitir editar sesiones de horarios publicados:
  `20260728143000_permitir_edicion_horarios_publicados.sql`.
- No se modificaron migraciones que ya podrían estar aplicadas en producción.

## Pendientes obligatorios antes de presentar

- [ ] En Finder, seleccionar la carpeta del proyecto y usar **Mantener descargado**. iCloud está expulsando archivos como `dataless` y bloquea compilaciones largas.
- [ ] Aplicar todas las migraciones pendientes en Supabase.
- [ ] Confirmar que `.env.local` tenga `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y la clave de servicio usada por las operaciones administrativas.
- [ ] Ejecutar `npm install`.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npx tsc --noEmit`.
- [ ] Ejecutar `npm test` y comprobar que Vitest termine, no solamente que inicie.
- [ ] Ejecutar `npm run build` y comprobar que Next.js finalice correctamente.
- [ ] Probar con datos reales el flujo completo descrito abajo.
- [ ] Vincular el repositorio con un proyecto de Vercel si se requiere una URL pública. La cuenta consultada no tenía un proyecto `calidaddelsoft` asociado.

## Flujo mínimo de prueba

1. Iniciar sesión como coordinador.
2. Crear o activar un período académico.
3. Crear docentes y registrar su disponibilidad.
4. Crear materias; comprobar que el código pueda quedar vacío.
5. Crear cursos con semestre, sede y cantidad de estudiantes.
6. Crear aulas ingresando solo el número.
7. Confirmar que el aula tenga disponibilidad de lunes a viernes, de 08:00 a 17:00.
8. En **Preparar horario**, asignar docente a materia y curso.
9. Generar automáticamente un horario y revisar los mensajes de error.
10. Crear un horario manual y agregar una clase desde cero.
11. Mover una clase y cambiar su aula.
12. Publicar el horario y confirmar que todavía pueda editarse.
13. Consultar el horario por curso y por docente.
14. Descargar el PDF completo y el PDF del docente.

## Pendientes funcionales recomendados

- [ ] Agregar eliminación manual de clases desde el editor. Actualmente se pueden crear y mover, pero no eliminar desde la interfaz.
- [ ] Permitir editar una franja de disponibilidad de aula en la misma fila. Actualmente se puede quitar y volver a crear.
- [ ] Añadir confirmación antes de modificar un horario ya publicado.
- [ ] Mostrar en el editor un filtro principal por curso cuando existan muchas clases.
- [ ] Completar una revisión visual de textos secundarios donde todavía pueda aparecer la palabra técnica `grupo` o `espacio`.
- [ ] Agregar pruebas automatizadas para creación manual, edición de publicados y disponibilidad inicial de aulas.
- [ ] Ejecutar una prueba de PDF autenticada contra Supabase con un horario real y varias clases simultáneas.
- [ ] Verificar el comportamiento cuando una materia virtual no necesita aula y cuando una materia presencial sí la requiere.

## Repartición sugerida

| Responsable | Tarea |
|---|---|
| Integrante 1 | Aplicar migraciones, revisar RLS y probar edición de publicados |
| Integrante 2 | Probar generación automática y creación manual por curso |
| Integrante 3 | Revisar disponibilidad de docentes/aulas y añadir edición en línea |
| Integrante 4 | Probar PDFs, responsive y textos restantes |
| Todo el equipo | Ejecutar lint, tipos, pruebas, build y ensayo de presentación |

## Comandos de verificación

```bash
cd /Users/pau/Documents/devStudent/calidaddelsoft
npm install
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run dev
```

La aplicación estará disponible localmente en [http://localhost:3000](http://localhost:3000).

## Nota importante sobre iCloud

Durante la revisión, varios archivos aparecieron con el atributo `compressed,dataless`. Esto hizo que TypeScript, Vitest, Git y Next.js quedaran esperando sin producir un resultado final. No debe interpretarse como una prueba aprobada. Antes de continuar, el equipo debe mantener descargada la carpeta completa o mover el repositorio a una ubicación local que no esté optimizada por iCloud.
