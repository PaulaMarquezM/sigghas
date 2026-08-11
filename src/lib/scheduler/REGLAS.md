# Reglas de negocio del motor de horarios

`SIGGHAS.md` dice que el sistema implementa **43 reglas de negocio**, pero en todo el
repositorio (migraciones SQL, comentarios de código, `seed.mjs`/`seed.sql`, el propio
`SIGGHAS.md`, `DIVISION_TRABAJO.md` y la landing pública `src/app/page.tsx`) solo aparecen
**15 códigos `RNxx` reales**: 01, 02, 03, 04, 07, 10, 13, 14, 16, 19, 21, 30, 37, 39 y 41
(este último solo como comentario SQL en `espacios.disponible`, no estaba en la tabla
resumen de `SIGGHAS.md`). Se buscó exhaustivamente con `grep -rn "RN\d{2}"` en todo el
proyecto — las 28 restantes (RN05, RN06, RN08, RN09, RN11, RN12, RN15, RN17, RN18, RN20,
RN22–RN29, RN31–RN36, RN38, RN40, RN42, RN43) **no existen en ningún archivo de este
repositorio**. El "documento de requisitos" que menciona `DIVISION_TRABAJO.md` como fuente
de las 43 reglas no está en el repo (probablemente un doc externo del curso, tipo Google
Doc/PDF) — no se puede completar esa lista sin ese documento; no se inventaron reglas para
rellenar el número.

> Nota histórica: el proyecto tuvo en algún momento un archivo por regla
> (`src/lib/scheduler/rules/rn01-...ts` ... `rn43-...ts`), pero era código muerto que nunca
> se ejecutaba en producción y se eliminó. Las reglas reales viven en
> [`greedy.ts`](./greedy.ts) (`validarCandidato`, `generarSlots`) y
> [`backtrack.ts`](./backtrack.ts) (`resolverConBacktrack`).

## Las 15 reglas con código `RNxx` encontradas en el repo

| RN | Regla | Dónde vive | Test |
|---|---|---|---|
| RN01 | Un docente no puede estar en dos clases al mismo tiempo | `validarCandidato` → `DOCENTE_OCUPADO` (greedy.ts); además `EXCLUDE` `sesiones_no_solapa_docente` a nivel de Postgres | `validarCandidato.test.ts` → "DOCENTE_OCUPADO..." |
| RN02 | Un docente no puede dar clases presenciales en dos sedes el mismo día | `validarCandidato` → `DOCENTE_DOS_SEDES` | `validarCandidato.test.ts` → "DOCENTE_DOS_SEDES..." |
| RN03 | Las clases virtuales no tienen restricción geográfica pero sí de horario | `esPresencial()` excluye la comprobación de sede para modalidad no presencial; `DOCENTE_NO_DISPONIBLE` sigue aplicando siempre | `validarCandidato.test.ts` → tests de `DOCENTE_NO_DISPONIBLE` |
| RN04 | Solo se asignan clases dentro de la disponibilidad registrada del docente | `validarCandidato` → `DOCENTE_NO_DISPONIBLE` | `validarCandidato.test.ts` → "DOCENTE_NO_DISPONIBLE cuando el docente no tiene disponibilidad ese día" |
| RN07 | Los bloques de "tiempo oficina" no se usan para asignar clases | `validarCandidato`, variable `oficina` dentro de la misma comprobación `DOCENTE_NO_DISPONIBLE` | `validarCandidato.test.ts` → "...cuando la franja cae en tiempo de oficina" |
| RN10 | Un grupo no puede tener dos materias en el mismo horario | `validarCandidato` → `GRUPO_OCUPADO` | `validarCandidato.test.ts` → "GRUPO_OCUPADO..." |
| RN13 | Un aula no puede usarse por dos clases presenciales al mismo tiempo | `validarCandidato` → `ESPACIO_OCUPADO`; además `EXCLUDE` a nivel de Postgres | `validarCandidato.test.ts` → "ESPACIO_OCUPADO..." |
| RN14 | No se asignan grupos a aulas con capacidad insuficiente | `generarSlots`, filtro `e.capacidad >= grupo.cantidad_estudiantes` | `generarSlots.test.ts` → "RN14: no ofrece un aula con capacidad menor..." |
| RN16 | Las materias que requieren laboratorio solo van a laboratorios | `generarSlots`, filtro `materia.requiere_laboratorio ? e.tipo === "laboratorio" : true` | `generarSlots.test.ts` → "RN16: ...solo usa espacios tipo laboratorio" |
| RN19 | Las clases virtuales no necesitan aula física | `validarCandidato` → `ESPACIO_NO_PERMITIDO`; `generarSlots` genera `espacio_id: null` para no presenciales | `validarCandidato.test.ts` → "ESPACIO_NO_PERMITIDO..." |
| RN21 | Varios grupos pueden compartir una sesión virtual (misma materia/docente/horario) | `validarCandidato`, helper `compartida()` exime de `DOCENTE_OCUPADO` | `generarSlots.test.ts` → "dos grupos pueden compartir la misma sesión virtual..." |
| RN30 | El sistema bloquea guardar si hay conflictos críticos | `guardar_horario_generado` (RPC de Postgres) + `src/lib/scheduler/index.ts`: si `resolverConBacktrack` falla, no se persiste nada | Cypress `02-crear-horario-conflicto.cy.ts` (verifica que no se guarda ningún horario); no cubierto en Vitest — `index.ts` depende de Supabase real |
| RN37 | Todos los cambios quedan registrados en el historial | Trigger de Postgres sobre `historial_cambios` (migración `001_schema_inicial.sql` + `20260725120000_...sql`) | Nivel de base de datos, fuera del alcance de Vitest/Cypress actual — **gap conocido** |
| RN39 | Los grupos de una sede reciben clases presenciales solo en esa sede | `generarSlots`, filtro `e.sede_id === grupo.sede_id` | `generarSlots.test.ts` → "RN39: ...solo en espacios de su propia sede" |
| RN41 | Las aulas/laboratorios pueden habilitarse o deshabilitarse según el periodo (columna `espacios.disponible`) | `generarSlots`, filtro `e.disponible` | `generarSlots.test.ts` → "RN41: no ofrece un espacio deshabilitado" |

## Otros códigos de conflicto del motor (sin `RN` asignado en SIGGHAS.md)

Estos también son reglas de negocio reales que aplica el motor, documentadas aquí porque
`validarCandidato`/`resolverConBacktrack` las hacen cumplir, pero SIGGHAS.md no les puso
número:

| Código | Qué valida | Test |
|---|---|---|
| `FRANJA_INVALIDA` | Sesiones en bloques de 30 min, máximo 3h30 seguidas | `validarCandidato.test.ts` |
| `SABADO_NO_PERMITIDO` | Solo 7.º/8.º semestre tiene clase sábado | `validarCandidato.test.ts` |
| `EXCEDE_MAX_HORAS` | Carga semanal máxima del docente (`docente.max_horas_semana`) | `validarCandidato.test.ts` |
| `EXCEDE_MAX_HORAS_DIARIAS` / `GRUPO_EXCEDE_MAX_HORAS_DIARIAS` | Carga diaria máxima docente/grupo; solo si `config.max_horas_diarias` está definido (por defecto no hay tope) | `validarCandidato.test.ts` |
| `ESPACIO_REQUERIDO` | Una sesión presencial siempre necesita aula | `validarCandidato.test.ts` |
| `MODALIDAD_INVALIDA` | La modalidad de la sesión debe coincidir con la de la materia | `validarCandidato.test.ts` |
| `DOCENTE_SIN_ASIGNAR` | No se genera una sesión si la combinación materia–grupo no tiene docente | `greedy.test.ts` |
| `SESIONES_MISMO_DIA` | Las 2 sesiones semanales de una materia deben ir en días distintos | Ejercitada en `validarCandidato.test.ts` (el código se ejecuta, aunque en ese escenario el conflicto final reportado termina siendo el fallback `SIN_SLOTS_DISPONIBLES` del backtracking — ver comentario en el test) |

## Cobertura actual (`greedy.ts` / `backtrack.ts`)

Tras esta ronda de tests: `greedy.ts` ~95% líneas / ~81% ramas, `backtrack.ts` ~90% líneas /
100% funciones (`npm run test:coverage`, columna `src/lib/scheduler`). Lo que queda sin
cubrir son casos límite de la función `ordenar()` interna de `backtrack.ts` y la generación
de slots para modalidad no presencial en `generarSlots` (líneas 74-75, 91 de `greedy.ts`).

## Gaps conocidos (no cubiertos por Vitest, sí relevantes)

- **RN30** y **RN37** dependen de Postgres (RPC/triggers), no del motor en TypeScript — se
  verifican mejor con Cypress contra la base real (RN30 ya tiene spec; RN37 no tiene ningún
  test automatizado todavía).
- `src/lib/scheduler/index.ts` (la función pública `generate()` que llama Supabase) sigue en
  0% de cobertura — es la capa de integración, deliberadamente fuera del alcance de "solo
  validación pura" que se usó en esta ronda.
