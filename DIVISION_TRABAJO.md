# División del Trabajo — SIGGHAS
**Fases 2 al 6 · Grupo Quinto Semestre · PUCE Portoviejo 2026**

> La Fase 1 ya está completa: setup, autenticación, layout, landing y login.  
> Este documento divide el trabajo restante entre **3 integrantes** del equipo.

---

## Resumen de asignaciones

| Integrante | Fases asignadas | Área |
|---|---|---|
| **Pau** | Fase 2 | Gestión de entidades (CRUD completo) |
| **Compañero/a 2** | Fase 3 | Motor de generación automática |
| **Compañero/a 3** | Fases 4 + 5 | Edición manual + consultas + PDF |
| **Los 3** | Fase 6 | Suite de pruebas y calidad |

---

## Pau — Fase 2: Gestión de Entidades

> **Meta:** que un coordinador pueda administrar toda la data antes de generar horarios.

### Entidades a trabajar (CRUD completo para cada una)

#### 1. Docentes (`/dashboard/docentes`)
- Listar todos los docentes con filtros (sede, tipo de contrato, activo/inactivo)
- Crear docente: nombre, email, tipo_contrato (`titular` | `contratado` | `honorarios`), horas_max_semana, sede_id
- Editar docente
- Desactivar / reactivar (no borrar — los horarios históricos deben conservarse)

#### 2. Materias (`/dashboard/materias`)
- Listar materias con filtros (nivel, activo)
- Crear materia: nombre, codigo, horas_teoria, horas_practica, nivel (1–10), modalidad (`presencial` | `hibrida` | `virtual`)
- Editar materia
- Desactivar materia

#### 3. Grupos (`/dashboard/grupos`)
- Listar grupos con su carrera y nivel
- Crear grupo: nombre (ej. "SW-5A"), nivel, numero_estudiantes, sede_id, periodo_id
- Editar grupo
- Archivar grupo al cerrar el periodo

#### 4. Espacios Físicos (`/dashboard/espacios`)
- Listar aulas, laboratorios, salas con capacidad y tipo
- Crear espacio: nombre, tipo_espacio (`aula` | `laboratorio` | `sala_reuniones` | `auditorio`), capacidad, sede_id, tiene_proyector, tiene_internet, activo
- Editar espacio
- Desactivar espacio

#### 5. Periodos Académicos (`/dashboard/periodos`)
- Crear periodo: nombre (ej. "2026-I"), fecha_inicio, fecha_fin, activo
- Activar / cerrar periodo
- Solo puede haber un periodo activo a la vez (validar en UI y en DB)

#### 6. Disponibilidad Docente (`/dashboard/docentes/[id]/disponibilidad`)
- Vista de grilla semanal (L–V, 07:00–19:00, bloques de 1h)
- El docente o coordinador marca los bloques en que el docente SÍ está disponible
- Guardar en tabla `disponibilidad_docente` (docente_id, dia_semana, hora_inicio, hora_fin)

### Archivos a crear

```
src/app/dashboard/
├── docentes/
│   ├── page.tsx                   ← listado + filtros
│   ├── nuevo/page.tsx             ← form crear
│   ├── [id]/
│   │   ├── page.tsx               ← detalle / editar
│   │   └── disponibilidad/
│   │       └── page.tsx           ← grilla disponibilidad
│   └── actions.ts                 ← server actions CRUD
├── materias/
│   ├── page.tsx
│   ├── nuevo/page.tsx
│   ├── [id]/page.tsx
│   └── actions.ts
├── grupos/
│   ├── page.tsx
│   ├── nuevo/page.tsx
│   ├── [id]/page.tsx
│   └── actions.ts
├── espacios/
│   ├── page.tsx
│   ├── nuevo/page.tsx
│   ├── [id]/page.tsx
│   └── actions.ts
└── periodos/
    ├── page.tsx
    ├── nuevo/page.tsx
    └── actions.ts
```

### Componentes de UI a crear

```
src/components/entities/
├── DocenteForm.tsx
├── MateriaForm.tsx
├── GrupoForm.tsx
├── EspacioForm.tsx
├── PeriodoForm.tsx
├── DisponibilidadGrid.tsx         ← grilla de bloques horarios
└── DataTable.tsx                  ← tabla reutilizable con filtros y paginación
```

### Dependencias / librerías sugeridas
- `react-hook-form` + `zod` — validación de formularios
- `@tanstack/react-table` — tablas con ordenación y filtros
- Todo via Server Actions (no fetch manual) para mantener el patrón ya establecido

### Criterios de aceptación
- [ ] Coordinador puede crear, editar y desactivar las 5 entidades
- [ ] Todos los formularios tienen validación de campos requeridos
- [ ] Las listas tienen búsqueda y filtro básico
- [ ] La grilla de disponibilidad guarda correctamente en Supabase
- [ ] Solo una sede y un periodo activos pueden operar a la vez

---

## Compañero/a 2 — Fase 3: Motor de Generación Automática

> **Meta:** dado un periodo activo con entidades cargadas, el sistema genera un horario sin conflictos.

### Contexto técnico
- 43 reglas de negocio (RN01–RN43) definidas en el documento de requisitos
- Algoritmo sugerido: **Greedy con backtracking** — asigna materias una a una; si hay conflicto, retrocede y prueba otra combinación
- El proceso puede tardar varios segundos → debe correr en background (no bloquear la UI)

### Archivos a crear

```
src/lib/scheduler/
├── types.ts                       ← tipos internos del motor (Slot, Asignacion, etc.)
├── rules/
│   ├── index.ts                   ← exporta todas las reglas
│   ├── rn01-horas-max-docente.ts
│   ├── rn02-disponibilidad.ts
│   ├── rn03-conflicto-aula.ts
│   ├── rn04-conflicto-docente.ts
│   ├── rn05-capacidad-aula.ts
│   ├── rn06-tipo-espacio.ts       ← labs solo para prácticas
│   ├── rn07-bloques-contiguos.ts  ← prácticas van juntas
│   └── ...                        ← una por regla hasta rn43
├── greedy.ts                      ← algoritmo principal
├── backtrack.ts                   ← backtracking auxiliar
└── index.ts                       ← función pública generate(periodoId)

src/app/dashboard/generar/
├── page.tsx                       ← botón "Generar horario" + log en tiempo real
└── actions.ts                     ← server action que llama generate()

src/app/api/scheduler/route.ts     ← (opcional) endpoint si se necesita long-running
```

### Estructura de reglas (cada archivo sigue este patrón)

```typescript
// src/lib/scheduler/rules/rn03-conflicto-aula.ts
import type { Asignacion, Slot } from "../types";

export function rn03ConflictoAula(
  candidato: Slot,
  asignadas: Asignacion[]
): boolean {
  // Retorna true si el slot es VÁLIDO (no hay conflicto)
  return !asignadas.some(
    (a) =>
      a.espacio_id === candidato.espacio_id &&
      a.dia === candidato.dia &&
      a.hora_inicio < candidato.hora_fin &&
      a.hora_fin > candidato.hora_inicio
  );
}
```

### Flujo del algoritmo

```
1. Cargar todas las entidades del periodo activo desde Supabase
2. Ordenar materias por prioridad (más restricciones primero)
3. Para cada materia:
   a. Generar todos los slots posibles (día × hora × espacio × docente)
   b. Filtrar slots que pasan las 43 reglas
   c. Elegir el mejor slot (greedy: el que deja más opciones para los demás)
   d. Si no hay slots válidos → backtrack a la materia anterior y elegir diferente
4. Al terminar, guardar el horario en tabla `horarios` + `asignaciones`
5. Registrar qué reglas fallaron (log de conflictos)
```

### Página de generación (`/dashboard/generar`)
- Selector de periodo activo
- Botón "Generar horario"
- Log en tiempo real de lo que va asignando (usando `ReadableStream` o polling)
- Resumen final: N asignaciones creadas, M conflictos sin resolver
- Estado del horario: `borrador` → coordinador debe revisar antes de publicar

### Criterios de aceptación
- [ ] Las 43 reglas están implementadas como funciones puras testeables
- [ ] El algoritmo completa sin error para un semestre de 10 materias × 5 grupos
- [ ] Los conflictos se reportan con detalle (qué regla falló, qué materia/grupo/docente)
- [ ] El horario generado se guarda en Supabase con estado `borrador`
- [ ] La UI muestra progreso y resultado sin timeout del navegador

---

## Compañero/a 3 — Fases 4 + 5: Edición Manual + Consultas + PDF

> **Meta:** que el coordinador pueda ajustar el horario generado, y que todos los roles puedan verlo y descargarlo.

### Fase 4 — Edición manual con validaciones en tiempo real

#### Vista del horario editable (`/dashboard/editar/[horarioId]`)
- Grilla visual: columnas = días (L–V), filas = bloques horarios (07:00–19:00)
- Cada celda muestra: materia, docente, aula, grupo
- **Drag and drop** de bloques entre celdas
- Al soltar una celda: validar en tiempo real contra las 43 reglas
  - Si pasa → guardar el cambio inmediatamente
  - Si falla → mostrar qué regla se viola, revertir al lugar original
- Panel lateral: lista de conflictos pendientes (si los hay del algoritmo)
- Botón "Publicar horario" → cambia estado de `borrador` a `publicado`

#### Archivos a crear

```
src/app/dashboard/editar/
├── [horarioId]/
│   ├── page.tsx                   ← carga datos del servidor
│   └── HorarioEditor.tsx          ← "use client" — lógica drag & drop

src/components/horario/
├── HorarioGrid.tsx                ← grilla visual (semana completa)
├── HorarioCell.tsx                ← celda individual con materia/docente/aula
├── ConflictPanel.tsx              ← panel lateral de conflictos
└── BloqueDraggable.tsx            ← bloque arrastrable

src/app/dashboard/editar/[horarioId]/
└── actions.ts                     ← moverBloque(asignacionId, nuevoDia, nuevaHora)
```

#### Librería sugerida
- `@dnd-kit/core` + `@dnd-kit/sortable` — drag and drop accesible
- La validación de reglas llama a las mismas funciones puras del scheduler (reutiliza Fase 3)

---

### Fase 5 — Consultas por rol + exportación PDF

#### Vistas de consulta por rol

| Ruta | Rol | Qué ve |
|---|---|---|
| `/dashboard/horario` | coordinador / admin | Todos los grupos, filtrable |
| `/dashboard/mi-horario` | docente | Solo sus asignaciones |
| `/dashboard/mi-horario` | estudiante | El horario de su grupo |
| `/dashboard/disponibilidad` | apoyo | Aulas libres en tiempo real |

#### Archivos a crear

```
src/app/dashboard/
├── horario/
│   ├── page.tsx                   ← coordinador: selector de grupo + vista
│   └── [grupoId]/page.tsx         ← horario de un grupo específico
├── mi-horario/
│   └── page.tsx                   ← redirige por rol (docente o estudiante)
└── disponibilidad/
    └── page.tsx                   ← mapa de aulas: verde=libre, rojo=ocupada

src/components/horario/
├── HorarioReadOnly.tsx            ← grilla de solo lectura (docente/estudiante)
├── DisponibilidadAulas.tsx        ← mapa visual de aulas en tiempo real
└── HorarioFilters.tsx             ← selectores de periodo, grupo, sede
```

#### Exportación PDF

```
src/app/api/pdf/
├── horario/
│   └── [horarioId]/
│       └── route.ts               ← GET → devuelve PDF del horario completo
└── mi-horario/
    └── route.ts                   ← GET → PDF del horario del docente/estudiante autenticado

src/lib/pdf/
├── HorarioPDF.tsx                 ← componente @react-pdf/renderer
├── MiHorarioPDF.tsx               ← versión individual
└── styles.ts                      ← estilos PDF reutilizables
```

#### Botones de descarga en UI
- Botón "Descargar PDF" en cada vista de horario
- Llama a `/api/pdf/horario/[id]` → descarga automática
- El PDF incluye: logo PUCE, nombre del grupo/docente, periodo, grilla completa

#### Criterios de aceptación
- [ ] Cada rol solo puede ver lo que le corresponde (validado con `requireRol()`)
- [ ] El coordinador puede filtrar por grupo, docente o periodo
- [ ] La vista de disponibilidad de aulas se actualiza en tiempo real (polling o Supabase realtime)
- [ ] El PDF tiene diseño limpio con la grilla horaria, legible al imprimir
- [ ] El PDF se genera en menos de 3 segundos para un horario completo

---

## Los 3 — Fase 6: Suite de Pruebas y Calidad del Software

> **Meta:** garantizar que el sistema cumple las 43 reglas de negocio y que la integración entre fases funciona.

### Responsabilidad individual

| Integrante | Qué prueba |
|---|---|
| **Pau** | Tests unitarios del CRUD de entidades + validaciones de formularios |
| **Compañero/a 2** | Tests unitarios de las 43 reglas del scheduler |
| **Compañero/a 3** | Tests de integración end-to-end (flujo completo: crear → generar → editar → exportar) |

### Stack de testing

```bash
# Unit tests
npm install --save-dev vitest @testing-library/react @testing-library/user-event jsdom

# E2E tests
npm install --save-dev playwright @playwright/test
npx playwright install
```

### Estructura de archivos de prueba

```
src/
└── __tests__/
    ├── entities/
    │   ├── docentes.test.ts        ← Pau: CRUD + validaciones
    │   ├── materias.test.ts
    │   ├── grupos.test.ts
    │   ├── espacios.test.ts
    │   └── periodos.test.ts
    ├── scheduler/
    │   ├── rn01.test.ts            ← Compañero/a 2: una por regla
    │   ├── rn02.test.ts
    │   ├── ...
    │   ├── rn43.test.ts
    │   └── greedy.test.ts          ← algoritmo completo con datos mock
    └── integration/
        ├── auth.spec.ts            ← Compañero/a 3: login/logout
        ├── crear-horario.spec.ts   ← flujo completo de generación
        └── pdf-export.spec.ts      ← descarga de PDF

e2e/
├── coordinador.spec.ts             ← flujo completo coordinador
├── docente.spec.ts                 ← flujo docente
└── estudiante.spec.ts             ← flujo estudiante
```

### Métricas mínimas de calidad

- Cobertura de las 43 reglas de negocio: **100%** (todas tienen al menos un test)
- Cobertura de código general: **≥ 70%**
- Tests E2E: flujo completo sin errores en Chrome + Firefox
- `npm run lint` → 0 errores
- `npx tsc --noEmit` → 0 errores de tipos

### Script de CI (GitHub Actions — opcional)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npx vitest run
```

---

## Dependencias entre fases

```
Fase 2 (CRUD) ──────────────────────────────┐
                                             ▼
                                    Fase 3 (Motor)
                                             │
                    ┌────────────────────────┘
                    ▼
           Fase 4 (Editor manual)
                    │
                    ▼
           Fase 5 (Consultas + PDF)
                    │
           ┌────────┘
           ▼
   Fase 6 (Pruebas) ← prueba TODO
```

> **Regla de coordinación:** nadie empieza su fase sin que la anterior esté mergueada a `main`.  
> Usa ramas: `fase-2/crud-entidades`, `fase-3/motor-scheduler`, `fase-4-5/editor-pdf`.

---

## Convenciones de código compartidas

- **Server Actions** para toda mutación (no fetch directo al cliente de Supabase desde componentes)
- **`requireRol(...)`** al inicio de toda página protegida por rol
- **Tipos de `src/types/database.ts`** — no redefinir tipos que ya existen
- **Clases CSS con prefijo `s-`** para elementos UI personalizados (no sobreescribir Tailwind)
- **Commits en español** con formato: `feat(entidad): descripción`, `fix(scheduler): ...`, `test(rn03): ...`
- **Pull Request** por fase — no hacer PR de todo junto al final

---

## Estado de referencia — lo que ya está hecho

| Módulo | Archivo | Estado |
|---|---|---|
| Setup Next.js + Supabase | `package.json`, `.env.local` | ✅ |
| Sistema de diseño CSS | `src/styles/sigghas.css` | ✅ |
| Landing pública | `src/app/page.tsx` | ✅ |
| Página de login | `src/app/login/page.tsx` | ✅ |
| Server Actions auth | `src/app/login/actions.ts` | ✅ |
| Middleware de rutas | `src/middleware.ts` | ✅ |
| Clientes Supabase | `src/lib/supabase/` | ✅ |
| Helpers de auth | `src/lib/auth.ts` | ✅ |
| Navegación por rol | `src/lib/nav.ts` | ✅ |
| Tipos TypeScript | `src/types/database.ts` | ✅ |
| Layout del dashboard | `src/app/dashboard/layout.tsx` | ✅ |
| Dashboard home | `src/app/dashboard/page.tsx` | ✅ |
| Sidebar + Topbar | `src/components/layout/` | ✅ |
| Schema SQL | `supabase/migrations/001_schema_inicial.sql` | ⚠️ Aplicar manualmente |

---

*Documento generado el 26 de mayo de 2026 · SIGGHAS · PUCE Portoviejo*
