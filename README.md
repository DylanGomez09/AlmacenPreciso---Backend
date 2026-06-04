# AlmacenPreciso Backend

API REST para la gestión de inventario de almacenes. Los dueños crean un almacén con un código único, los empleados se unen usando ese código, y ambos gestionan faltantes en tiempo real.

## Stack

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js |
| Framework | Express |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (JWT) |
| Hosting | Railway |

## Tablas (Supabase)

### `usuarios`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid PK | UUID de Supabase Auth |
| `email` | text | |
| `nombre` | text | |
| `rol` | text | `dueño` o `empleado` |
| `comercio_id` | uuid FK → comercios | Nullable hasta unirse |

### `comercios`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid PK | |
| `nombre` | text | |
| `codigo_unico` | text | Formato `AP-XXXX` |

### `faltantes`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid PK | |
| `nombre` | text | |
| `categoria` | text | Default `General` |
| `estado` | text | `activo`, `comprado`, `pendiente_borrado` |
| `comercio_id` | uuid FK → comercios | |
| `actualizado_por` | text | Nombre del último editor |
| `created_at` | timestamptz | |

## Endpoints

### Auth — `/api/auth`

| Método | Ruta | Auth | Body | Descripción |
|--------|------|------|------|-------------|
| POST | `/register` | — | `{ email, password, nombre, rol, comercio_id? }` | Registrar usuario |
| POST | `/login` | — | `{ email, password }` | Iniciar sesión → `{ token, usuario }` |
| GET | `/me` | Bearer | — | Perfil del usuario autenticado |
| POST | `/join` | Bearer | `{ codigo_unico }` | Unirse a un almacén por código |

### Comercios — `/api/comercios`

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| POST | `/` | Bearer | dueño | Crear almacén (asigna al dueño automáticamente) |
| GET | `/me` | Bearer | — | Obtener mi almacén asignado |
| GET | `/:codigo` | — | — | Buscar almacén por `codigo_unico` |

### Usuarios — `/api/usuarios`

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/` | Bearer | dueño | Listar empleados del almacén |
| POST | `/invitar` | Bearer | dueño | Invitar empleado (lo crea en su almacén) |

### Faltantes — `/api/faltantes`

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/` | Bearer | — | Listar faltantes (filtro: `?estado=activo`) |
| POST | `/` | Bearer | — | Crear faltante `{ nombre, categoria? }` |
| PATCH | `/:id/estado` | Bearer | — | Cambiar estado (empleado solo → `pendiente_borrado`) |
| DELETE | `/:id/aprobar` | Bearer | dueño | Aprobar y eliminar definitivamente |
| PATCH | `/:id/rechazar` | Bearer | dueño | Rechazar solicitud de borrado |

## Variables de entorno

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-supabase-anon-key
PORT=3000
```

## Desarrollo local

```bash
# Clonar e instalar
git clone <repo>
cd almacenpreciso-backend
pnpm install

# Configurar .env (copiar el template de arriba)
# Iniciar servidor
node index.js
# Servidor en http://localhost:3000
```

## Despliegue en Railway

1. Crear repo en GitHub y subir el código
2. Ir a [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Conectar el repo
4. En la pestaña **Variables**, agregar:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
5. Railway detecta `package.json` y ejecuta `node index.js` automáticamente
6. El dominio se asigna automáticamente (ej. `almacenpreciso-backend.up.railway.app`)

> ⚠️ El frontend (React Native) se deploya aparte, no en Railway. Publicarlo con Expo o subir a stores.

## Flujo completo

```
1. Dueño se registra → POST /api/auth/register { rol: "dueño" }
2. Dueño crea almacén → POST /api/comercios/   → obtiene código AP-XXXX
3. Empleado se registra → POST /api/auth/register { rol: "empleado" }
4. Empleado se une → POST /api/auth/join { codigo_unico: "AP-XXXX" }
5. Ambos gestionan faltantes → POST/GET/PATCH /api/faltantes/
```
