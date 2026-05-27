# SIGGHAS
## Sistema Inteligente de Generación y Gestión de Horarios Académicos para la Carrera de Software

**Pontificia Universidad Católica del Ecuador — Sede Portoviejo**  
**Carrera de Ingeniería en Software · Quinto Semestre**  
**Materia:** Calidad del Software · **Docente:** Ing. Victor Alonso  

---

## ¿Qué es SIGGHAS?

SIGGHAS es una aplicación web diseñada para resolver uno de los problemas más complejos de la coordinación académica: **generar y gestionar los horarios de la Carrera de Software** de forma inteligente, automática y sin conflictos.

Actualmente, la planificación de horarios se hace de forma manual o semi-manual usando hojas de cálculo, lo que genera:

- Choques de horarios entre docentes, grupos y aulas
- Errores al coordinar entre las sedes de **Manta** y **Portoviejo**
- Asignación incorrecta de aulas (capacidad insuficiente, sin accesibilidad)
- Horas desperdiciadas revisando conflictos a mano
- Inconsistencias entre clases presenciales y virtuales

SIGGHAS automatiza todo ese proceso con un motor de validación basado en **43 reglas de negocio** reales de la institución.

---

## ¿Para quién es?

El sistema tiene **5 tipos de usuarios**, cada uno con acceso diferente:

| Rol | ¿Qué puede hacer? |
|---|---|
| 🟣 **Coordinador Académico** | Todo: generar, editar, aprobar y publicar horarios. Es el usuario principal del sistema. |
| 🟢 **Docente** | Consultar su propio horario, ver sus aulas asignadas y descargar en PDF. |
| 🔵 **Estudiante** | Ver el horario de su grupo/paralelo y descargarlo en PDF. |
| 🟠 **Administrador** | Gestionar usuarios, roles y configuración técnica del sistema. |
| ⚪ **Personal de Apoyo** | Consultar qué aulas están ocupadas o disponibles para apoyo logístico. |

---

## ¿Qué hace el sistema? — Funcionalidades principales

### 1. Gestión de Entidades Académicas
El coordinador puede registrar y administrar toda la información base que el sistema necesita para funcionar:

- **Docentes** — nombre, tipo de contrato (tiempo completo / por horas), carga horaria máxima, sede principal
- **Materias** — código, nombre, semestre, horas por semana, si requiere laboratorio
- **Grupos / Paralelos** — nombre (ej. SW-5A), semestre, cantidad de estudiantes, sede, si necesita accesibilidad
- **Aulas y Laboratorios** — nombre, capacidad, tipo, accesibilidad, sede, si está habilitada
- **Sedes** — Portoviejo (sede central) y Manta
- **Periodos Académicos** — 2026-I, 2026-II, etc.

---

### 2. Gestión de Disponibilidad Docente
Antes de generar un horario, el sistema necesita saber cuándo puede dar clases cada docente:

- Registrar bloques horarios disponibles por día (lunes a sábado)
- Marcar bloques como **"tiempo oficina"** — horas reservadas para investigación u otras actividades, que el sistema **nunca usará** para asignar clases
- Diferenciar entre docentes de tiempo completo (con horario de entrada/salida) y docentes por horas
- Controlar restricciones geográficas: un docente no puede dar clase presencial en Manta y Portoviejo **el mismo día**

---

### 3. Generación Automática de Horarios ⚡
El módulo más importante del sistema. Con un clic, el coordinador puede generar una propuesta completa de horario para un periodo académico.

El motor de generación considera automáticamente **todas las restricciones** registradas:

- ✅ Disponibilidad horaria de cada docente
- ✅ Capacidad de las aulas (no asignar 40 estudiantes en un aula de 25)
- ✅ Accesibilidad (grupos que la necesitan → solo aulas accesibles)
- ✅ Tipo de espacio (materias de laboratorio → solo laboratorios)
- ✅ Conflictos docente (un docente no puede dar dos clases al mismo tiempo)
- ✅ Conflictos de grupo (un paralelo no puede tener dos materias a la misma hora)
- ✅ Conflictos de aula (un aula no puede usarse dos veces en el mismo bloque)
- ✅ Restricciones entre sedes (no asignar a un docente presencialmente en dos sedes el mismo día)
- ✅ Clases virtuales vs presenciales (las virtuales no necesitan aula física)
- ✅ Sesiones virtuales compartidas (varios grupos en una misma sesión virtual)

Si el sistema detecta que no puede generar sin conflictos, muestra exactamente **qué restricción no se puede cumplir** y el coordinador puede ajustar.

---

### 4. Edición Manual con Validación en Tiempo Real ✏️
Después de generar el horario automáticamente, el coordinador puede ajustarlo manualmente. Pero no es edición libre: el sistema **valida cada cambio en tiempo real**.

- Al mover una clase → el sistema verifica al instante si hay conflicto
- Si hay un **conflicto menor** (advertencia) → se muestra una alerta visual pero se puede guardar
- Si hay un **conflicto crítico** (docente doble, aula ocupada) → el sistema **bloquea el guardado**
- Cada cambio requiere **confirmación** antes de aplicarse
- Todos los cambios quedan en el **historial de auditoría** (quién, cuándo, qué cambió)

---

### 5. Consulta de Horarios por Rol 🔍
Cada tipo de usuario puede consultar horarios según lo que le corresponde:

- **Coordinador** → ve todos los horarios de ambas sedes, puede filtrar por docente, grupo, aula, sede o periodo
- **Docente** → ve solo su propio horario con sus aulas y modalidades
- **Estudiante** → ve el horario de su grupo/paralelo
- **Personal de Apoyo** → ve qué aulas están disponibles u ocupadas en tiempo real, por sede, horario y día

---

### 6. Exportación a PDF 📄
Cualquier usuario puede descargar el horario que le corresponde en formato PDF oficial, listo para imprimir o compartir. El coordinador puede generar reportes completos de:

- Carga horaria por docente
- Ocupación de aulas
- Horario completo por sede o por periodo

---

### 7. Seguridad y Auditoría 🔒
- Cada usuario accede **solo** a lo que su rol permite
- Login con credenciales institucionales
- Registro completo de cambios: quién editó, qué cambió, cuándo
- Las aulas y laboratorios pueden **habilitarse o deshabilitarse** según el periodo académico

---

## Reglas de Negocio (resumen)

El sistema implementa **43 reglas de negocio** que representan las políticas reales de la institución. Aquí las más importantes:

| Código | Regla |
|---|---|
| RN01 | Un docente no puede estar en dos clases al mismo tiempo |
| RN02 | Un docente no puede dar clases presenciales en dos sedes el mismo día |
| RN03 | Las clases virtuales no generan restricción geográfica, pero sí respetan disponibilidad horaria |
| RN04 | Solo se asignan clases dentro de la disponibilidad registrada del docente |
| RN07 | Los bloques de "tiempo oficina" no se usan para asignar clases |
| RN10 | Un grupo no puede tener dos materias en el mismo horario |
| RN13 | Un aula no puede usarse por dos clases presenciales al mismo tiempo |
| RN14 | No se asignan grupos a aulas con capacidad insuficiente |
| RN16 | Las materias que requieren laboratorio solo van a laboratorios |
| RN19 | Las clases virtuales no necesitan aula física |
| RN21 | Múltiples grupos pueden compartir una sesión virtual si es la misma materia, docente y horario |
| RN30 | El sistema bloquea guardar si hay conflictos críticos |
| RN37 | Todos los cambios quedan registrados en el historial |
| RN39 | Los grupos de una sede reciben clases presenciales solo en esa misma sede |

---

## Tecnologías utilizadas

| Capa | Tecnología | ¿Por qué? |
|---|---|---|
| Frontend + Backend | **Next.js 14** + TypeScript | App Router, Server Actions, todo en un solo repo |
| Base de datos | **Supabase** (PostgreSQL) | BD + auth + tiempo real, listo en minutos |
| Autenticación | **Supabase Auth** | Login seguro con manejo de sesiones y roles |
| UI / Componentes | **Tailwind CSS** + **shadcn/ui** | Diseño limpio y consistente sin esfuerzo extra |
| Datos del servidor | **TanStack Query** | Caché y sincronización de datos eficiente |
| Exportación PDF | **@react-pdf/renderer** | PDFs generados desde el servidor |
| Motor de horarios | Algoritmo propio en TypeScript | Greedy con backtracking, fácil de testear |

---

## Estructura de la Base de Datos

```
sedes               → Portoviejo y Manta
perfiles            → Todos los usuarios con su rol
docentes            → Info extra de cada docente
disponibilidad_docente → Bloques horarios por docente y día
materias            → Asignaturas de la carrera
grupos              → Paralelos académicos
espacios            → Aulas y laboratorios
periodos            → Periodos académicos (2026-I, 2026-II...)
horarios            → Contenedor de horario por periodo
sesiones            → Cada asignación: docente + materia + grupo + aula + hora
sesiones_grupos_compartidos → Para clases virtuales con múltiples grupos
historial_cambios   → Auditoría de cada modificación
```

---

## Fases de Desarrollo

| Fase | Nombre | Estado |
|---|---|---|
| **1** | Fundación — Setup, Auth, Layout base | ✅ Completada |
| **2** | Gestión de Entidades Académicas | 🔄 En progreso |
| **3** | Motor de Generación Automática | ⏳ Pendiente |
| **4** | Edición Manual y Validaciones | ⏳ Pendiente |
| **5** | Consultas y Exportación PDF | ⏳ Pendiente |
| **6** | Calidad y Pruebas | ⏳ Pendiente |

---

## Alcance del sistema

### ✅ El sistema SÍ incluye:
- Gestión completa de horarios para la Carrera de Software
- Sedes de Manta y Portoviejo
- Clases presenciales y virtuales
- Generación automática y edición manual con validaciones
- Control de disponibilidad docente
- Gestión dinámica de aulas y laboratorios
- Exportación en PDF
- Historial de cambios y auditoría

### ❌ El sistema NO incluye:
- Otras carreras o facultades de la PUCE
- Módulos financieros o contables
- Control de matrícula estudiantil
- Control biométrico de asistencia
- Integración con plataformas externas (Moodle, Banner, etc.)
- Gestión de infraestructura universitaria general

---

*Proyecto desarrollado para la materia de Calidad del Software — PUCE Portoviejo, 2026*
