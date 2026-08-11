# SIGGHAS

**Sistema Inteligente de Generación y Gestión de Horarios Académicos** para la PUCE Portoviejo.

SIGGHAS permite administrar la información académica, configurar disponibilidades, generar horarios, editarlos con validaciones y consultar o descargar los horarios resultantes.

## Estado del sistema

El repositorio contiene un sistema funcional con:

- Autenticación mediante Supabase Auth.
- Control de acceso por roles y protección de rutas.
- CRUD de sedes, docentes, materias, cursos, aulas y períodos.
- Registro de disponibilidad de docentes y aulas.
- Matrículas de estudiantes.
- Generación automática y creación manual de horarios.
- Edición de sesiones con validación de solapamientos y restricciones.
- Estados de horario: borrador, aprobado y publicado.
- Consulta por curso y por docente.
- Reportes PDF.
- Historial de cambios.
- Pruebas unitarias y de componentes con Vitest, además de configuración E2E con Playwright y Cypress.

## Tecnologías

- Next.js `16.2.6` y React `19.2.4`.
- TypeScript.
- Supabase: PostgreSQL, Auth y Row Level Security (RLS).
- Tailwind CSS 4 y componentes de interfaz basados en shadcn/ui.
- Vitest, Testing Library, Playwright y Cypress.
- `@react-pdf/renderer` para generar reportes.

## Requisitos previos

| Herramienta | Versión |
|---|---|
| Node.js | `>=22.22.2 <23` |
| npm | `9` o superior |
| Git | Versión reciente |
| Supabase | Proyecto remoto configurado |

Comprueba las versiones con:

```bash
node -v
npm -v
git --version
```

## Instalación rápida

```bash
git clone <URL_DEL_REPOSITORIO>
cd calidaddelsoft
nvm use
npm install
```

Crea `.env.local` en la raíz. No subas este archivo al repositorio.

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

La clave `SUPABASE_SERVICE_ROLE_KEY` solo se usa en operaciones administrativas del servidor y nunca debe exponerse en el navegador.

## Base de datos

La base de datos está implementada en Supabase y versionada en [`supabase/migrations`](supabase/migrations). Las migraciones se aplican en orden y contienen el esquema, restricciones, índices, funciones, triggers y políticas RLS.

El modelo incluye, entre otras, estas entidades:

| Entidad | Propósito |
|---|---|
| `perfiles` | Usuarios de la aplicación y sus roles |
| `sedes` | Sedes universitarias |
| `docentes` | Información y disponibilidad de docentes |
| `materias` | Asignaturas académicas |
| `grupos` | Cursos o paralelos |
| `espacios` | Aulas y laboratorios |
| `periodos` | Períodos académicos |
| `horarios` | Cabeceras y estado de cada horario |
| `sesiones` | Clases asignadas a día, hora, docente y aula |
| `asignaciones_docente_periodo` | Preparación de la generación |
| `disponibilidad_espacio` | Franjas disponibles de aulas |
| `estudiantes` y `matriculas_estudiante` | Estudiantes y sus materias inscritas |
| `historial_cambios` | Auditoría de cambios en horarios |

### Aplicar migraciones

Configura el proyecto de Supabase y ejecuta:

```bash
npx supabase login
npm run db:migrate
```

El comando vincula el proyecto remoto y ejecuta `supabase db push`. Si el equipo aplica las migraciones desde el panel de Supabase, debe ejecutarlas en orden y no modificar migraciones que ya estén aplicadas.

### Cargar datos de prueba

El seed requiere la clave de servicio porque crea o actualiza datos administrativos:

```bash
npm run db:seed
```

Usa el seed únicamente en un entorno de desarrollo o pruebas.

## Ejecutar el sistema

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El flujo recomendado es:

1. Crear un usuario en **Supabase > Authentication > Users**.
2. Completar su perfil en `perfiles` con uno de los roles permitidos.
3. Iniciar sesión en `/login`.
4. Configurar un período, sedes, docentes, materias, cursos y aulas.
5. Registrar disponibilidades y asignaciones docente-materia-curso.
6. Generar un horario o crear un borrador manual.
7. Revisar, editar y publicar el horario.
8. Consultar los horarios y descargar los reportes PDF.

## Roles y permisos

| Rol | Responsabilidades principales |
|---|---|
| `coordinador` | Administra entidades académicas, prepara, genera, edita y publica horarios |
| `docente` | Consulta su horario y registra o consulta la disponibilidad que le corresponda |
| `administrador` | Gestiona usuarios, configuración y sedes; tiene funciones administrativas |
| `apoyo` | Consulta la disponibilidad de aulas |

Los permisos se aplican en dos capas: la aplicación protege las rutas y acciones, y Supabase aplica políticas RLS en la base de datos. Los horarios publicados mantienen protecciones para evitar cambios no autorizados y registran las modificaciones en el historial.

## Organización del código

```text
calidaddelsoft/
├── src/app/                 # Rutas, páginas, layouts, acciones y API
│   ├── auth/                # Callback de autenticación
│   ├── dashboard/           # Módulos protegidos del sistema
│   └── api/pdf/             # Endpoints para reportes PDF
├── src/components/          # Componentes reutilizables de interfaz
├── src/lib/                 # Autenticación, Supabase, entidades y lógica de negocio
│   ├── scheduler/           # Algoritmos greedy y backtracking
│   └── pdf/                 # Plantillas y estilos de reportes
├── src/__tests__/           # Pruebas de entidades, páginas, componentes y utilidades
├── supabase/migrations/     # Evolución versionada de la base de datos
├── scripts/                 # Seed de datos de desarrollo
├── public/                  # Recursos estáticos
├── next.config.ts           # Configuración de Next.js
├── vitest.config.ts         # Configuración de pruebas unitarias
└── package.json             # Dependencias y comandos del proyecto
```

Las etiquetas visibles **Cursos** y **Aulas** corresponden internamente a las tablas y rutas históricas `grupos` y `espacios`, respectivamente. Esto evita una migración destructiva.

## Comandos disponibles

```bash
npm run dev                 # Desarrollo local
npm run build               # Compilación de producción
npm run start               # Ejecutar la compilación
npm run lint                # Revisar estilo y errores ESLint
npx tsc --noEmit            # Validar tipos TypeScript
npm test                    # Ejecutar pruebas Vitest
npm run test:watch          # Ejecutar Vitest en modo observación
npm run test:coverage       # Generar cobertura
npm run test:e2e            # Ejecutar pruebas E2E con Playwright
npm run db:migrate          # Aplicar migraciones Supabase
npm run db:seed             # Cargar datos de prueba
```

## Verificación antes de entregar

Ejecuta todos los controles desde una copia con la carpeta descargada localmente:

```bash
npm install
npm run lint
npx tsc --noEmit
npm test
npm run build
```

La entrega debe comprobar también el flujo funcional: autenticación, CRUD, disponibilidad, generación automática, edición manual, publicación, consulta por rol y descarga de ambos tipos de PDF.

## Solución de problemas

**`supabaseUrl is required`**: revisa que `.env.local` exista en la raíz y reinicia el servidor.

**El login vuelve a `/login`**: el usuario de Supabase Auth necesita un perfil asociado en `perfiles`.

**Falla `db:seed`**: verifica `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

**La compilación o las pruebas quedan esperando**: comprueba que los archivos del proyecto estén descargados localmente y no sean archivos `dataless` de iCloud.

**Hay errores de base de datos**: confirma que todas las migraciones se hayan aplicado en orden y que el proyecto Supabase sea el correcto.

## Equipo

Proyecto desarrollado por el Grupo de Quinto Semestre de Ingeniería en Software, PUCE Portoviejo, para la asignatura Calidad del Software (2026).
