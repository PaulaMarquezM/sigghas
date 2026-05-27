# SIGGHAS

**Sistema Inteligente de Generación y Gestión de Horarios Académicos**  
Pontificia Universidad Católica del Ecuador — Sede Portoviejo  
Carrera de Ingeniería en Software · Calidad del Software · 2026

---

## Requisitos previos

Antes de instalar, asegúrate de tener:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 18.x o superior | `node -v` |
| npm | 9.x o superior | `npm -v` |
| Git | cualquier versión reciente | `git --version` |

---

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone <URL-del-repositorio>
cd calidaddelsoft
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar las variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gcambzhsvizeqzpkxcig.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

> Pide la `ANON_KEY` al líder del equipo. Está en Supabase → Settings → API.

### 4. Aplicar el esquema de base de datos

> **Solo la primera vez** que alguien configure el proyecto desde cero.

1. Ve a [supabase.com](https://supabase.com) e inicia sesión con la cuenta del equipo
2. Abre el proyecto **CalidadSoft**
3. En el menú lateral → **SQL Editor** → **New query**
4. Copia y pega el contenido del archivo `supabase/migrations/001_schema_inicial.sql`
5. Haz clic en **Run**

Si el proyecto ya tiene tablas (`sedes`, `perfiles`, etc.), salta este paso.

### 5. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador. Deberías ver la landing de SIGGHAS.

---

## Estructura del proyecto

```
calidaddelsoft/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Landing pública (/)
│   │   ├── layout.tsx            ← Layout raíz (fuentes, metadatos)
│   │   ├── login/
│   │   │   ├── page.tsx          ← Pantalla de login
│   │   │   └── actions.ts        ← Server Actions: login / logout
│   │   ├── auth/callback/
│   │   │   └── route.ts          ← Callback OAuth de Supabase
│   │   └── dashboard/
│   │       ├── layout.tsx        ← Layout autenticado (sidebar + topbar)
│   │       └── page.tsx          ← Dashboard home
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx       ← Sidebar con navegación por rol
│   │   │   └── topbar.tsx        ← Header con título de ruta
│   │   └── ui/                   ← Componentes shadcn/ui
│   ├── lib/
│   │   ├── auth.ts               ← getSession(), requireRol()
│   │   ├── nav.ts                ← Menú por rol
│   │   └── supabase/
│   │       ├── client.ts         ← Cliente browser
│   │       └── server.ts         ← Cliente servidor
│   ├── styles/
│   │   └── sigghas.css           ← Sistema de diseño SIGGHAS
│   ├── types/
│   │   └── database.ts           ← Tipos TypeScript del schema
│   └── middleware.ts             ← Protección de rutas por autenticación
├── supabase/
│   └── migrations/
│       └── 001_schema_inicial.sql ← Schema completo de base de datos
├── .env.local                    ← Variables de entorno (NO subir a git)
├── SIGGHAS.md                    ← Documentación detallada del sistema
└── README.md                     ← Este archivo
```

---

## Comandos disponibles

```bash
# Desarrollo
npm run dev          # Levanta el servidor en localhost:3000

# Producción
npm run build        # Compila el proyecto para producción
npm run start        # Corre la versión compilada

# Calidad de código
npm run lint         # Revisa errores de ESLint
npx tsc --noEmit     # Verifica tipos TypeScript sin compilar
```

---

## Crear un usuario de prueba

Los usuarios se crean en Supabase Auth y luego se registra su perfil con rol:

**Paso 1:** Ve a **Supabase → Authentication → Users → Add user**  
Ingresa email y contraseña, copia el UUID generado.

**Paso 2:** En **SQL Editor**, ejecuta:

```sql
INSERT INTO perfiles (id, nombre, email, rol)
VALUES (
  'uuid-del-usuario',          -- pega el UUID del paso 1
  'Nombre Apellido',
  'correo@puce.edu.ec',
  'coordinador'                -- opciones: coordinador | docente | estudiante | administrador | apoyo
);
```

---

## Roles del sistema

| Rol | Acceso |
|---|---|
| `coordinador` | Total: generar, editar y aprobar horarios |
| `docente` | Ver y descargar su propio horario |
| `estudiante` | Ver y descargar el horario de su grupo |
| `administrador` | Gestión de usuarios y configuración técnica |
| `apoyo` | Consultar disponibilidad de aulas en tiempo real |

---

## Fases de desarrollo

| # | Fase | Estado |
|---|---|---|
| 1 | Fundación — Setup, Auth, Layout, Landing y Login | ✅ Completa |
| 2 | Gestión de entidades (CRUD docentes, materias, grupos, aulas) | 🔄 En progreso |
| 3 | Motor de generación automática de horarios | ⏳ Pendiente |
| 4 | Edición manual con validaciones en tiempo real | ⏳ Pendiente |
| 5 | Consultas por rol y exportación PDF | ⏳ Pendiente |
| 6 | Suite de pruebas y calidad del software | ⏳ Pendiente |

---

## Solución de problemas comunes

**El servidor no arranca:**
```bash
rm -rf .next node_modules
npm install
npm run dev
```

**Error "supabaseUrl is required":**
- Verifica que `.env.local` existe en la raíz del proyecto
- Asegúrate de que las variables empiecen con `NEXT_PUBLIC_`
- Reinicia el servidor después de crear o editar `.env.local`

**Login correcto pero redirige de vuelta al login:**
- El usuario existe en Auth pero no tiene registro en la tabla `perfiles`
- Ejecuta el INSERT del paso de creación de usuarios

**Error de tipos en TypeScript:**
```bash
npx tsc --noEmit
```

---

## Equipo

Proyecto desarrollado por el Grupo de Quinto Semestre  
**Docente:** Ing. Victor Alonso · **Materia:** Calidad del Software  
**PUCE Portoviejo — 2026**
