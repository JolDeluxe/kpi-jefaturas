# KPI Jefaturas

Aplicacion web monorepo para visualizar KPIs de jefaturas y gerencias a partir del CSV real `048 KPIs Jefaturas 260807 122334.csv`.

## Arquitectura

- `frontend/`: React + Vite + React Router + Zustand + Axios. Consume siempre rutas relativas `/api`.
- `backend/`: Express + TypeScript + Prisma + SQLite local. Sirve `/api/*` y, en produccion, tambien `frontend/dist`.
- `sync-agent/`: watcher Node/TypeScript con `chokidar`, SHA-256 y envio a `/api/sync/kpis`.

## Instalacion

```bash
npm install
```

## Variables de Entorno

Copia `.env.example` a `.env` y ajusta valores. No pongas secretos reales en git.

Variables principales:

- `DATABASE_URL`
- `JWT_SECRET`
- `COOKIE_NAME`
- `PORT`
- `SYNC_API_KEY`
- `WATCH_PATH`
- `API_URL`
- `CHECK_INTERVAL_MS`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_GERENTE_PASSWORD`
- `SEED_JEFE_PASSWORD`
- `SEED_CARGO_PASSWORD`

## Base de Datos Local

```bash
npm run db:up
npm run db:migrate
npm run db:seed
```

SQLite no requiere servidor ni Docker. La base local se crea en `backend/prisma/dev.db`.

## Importacion CSV

Importar el archivo incluido:

```bash
npm run import:csv
```

Importar otro archivo:

```bash
npm run import:csv -- "C:\ruta\archivo.csv"
```

La importacion calcula SHA-256, evita duplicar archivos identicos ya importados con exito, registra intentos, usa transaccion y conserva campos raw como `%`, `$`, `NA`, unidades y `<BR>`.

## Desarrollo

Un solo comando desde la raiz:

```bash
npm run dev
```

Levanta backend, frontend y sync-agent con `concurrently`.

URLs locales:

- Frontend dev: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`

## Produccion

```bash
npm run build
npm start
```

`npm run build` compila `frontend/dist`, backend y sync-agent. `npm start` levanta Express como una sola app HTTP:

- `/login`, `/dashboard`, `/dashboard/kpis`: React Router servido desde `frontend/dist/index.html`.
- `/api/auth/login`, `/api/kpis`, `/api/dashboard`: Express.

## Railway

Para Railway, lo recomendado sigue siendo cambiar a una base administrada como PostgreSQL o MySQL antes de produccion multiusuario. En local este proyecto queda en SQLite para facilidad.

Configura en Railway si decides desplegar con una base externa:

- `DATABASE_URL`
- `JWT_SECRET`
- `COOKIE_NAME`
- `SYNC_API_KEY`
- `NODE_ENV=production`
- `PORT` lo entrega Railway.

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

## Sync Agent

Por defecto se puede apuntar a:

```env
WATCH_PATH=C:\App\Joel\07_kpi_jefaturas\048 KPIs Jefaturas 260807 122334.csv
```

Despues puede cambiarse a una ruta de red sin modificar codigo:

```env
WATCH_PATH=\\SERVIDOR\AUDITOR INTERNO\PRIVADO\5 Isaac\archivo.csv
```

El backend protege `POST /api/sync/kpis` con `X-Sync-Key`.

## Roles y Permisos

Roles iniciales:

- `ADMIN`: todo.
- `DIRECCION`: cargo asignado y descendientes.
- `GERENTE`: cargo asignado y descendientes.
- `JEFE`: solo su cargo.
- `CONSULTA`: solo su cargo.

Scope de ejemplo:

- Cargo `200 GERENCIA ADMINISTRATIVA` ve `200` y `201`.
- Cargo `201 JEFATURA DE CONTABILIDAD` ve solo `201`.
- Cargo `300 GERENCIA OPERATIVA` ve `300` y `301-309`.
- El backend valida el scope en cada consulta, no solo React.

Usuarios DEV creados por seed:

- `admin@mbc.local`, usando `SEED_ADMIN_PASSWORD`.
- `gerente200@mbc.local`, usando `SEED_GERENTE_PASSWORD`.
- `jefe201@mbc.local`, usando `SEED_JEFE_PASSWORD`.
- Un usuario por cada cargo con patron `cargo<ID>@mbc.local`, usando `SEED_CARGO_PASSWORD`.

El seed no tiene contrasenas default. Si faltan variables de contrasena, falla antes de crear usuarios.

Ejemplos utiles:

- `cargo1@mbc.local`: empresa general, ve todos los cargos.
- `cargo100@mbc.local`: Direccion MBC, ve todos los cargos.
- `cargo200@mbc.local`: Gerencia Administrativa, ve 200 y 201.
- `cargo201@mbc.local`: Jefatura de Contabilidad, ve solo 201.
- `cargo300@mbc.local`: Gerencia Operativa, ve 300 y 301-309.
- `cargo302@mbc.local`: Jefatura Produccion Botas II, ve solo 302.
- `cargo400@mbc.local`: Gerencia Capital Humano, ve 400, 401 y 402.

Son credenciales locales de desarrollo.

## CSV

El analisis esta en `docs/csv-analysis.md`.

Datos detectados:

- 2600 filas.
- Anio 2026.
- Periodos presentes: `1,2,3,4,5,6,13,14,17,19`.
- Cargos presentes: `1,100-104,200-201,300-309,400-402`.
- No existe columna `Forma de Calculo`; la UI muestra `--`.
- No existe leyenda confiable para `13 Tendencia`; el mapper visual esta aislado en `frontend/src/features/kpis/utils/tendencia-map.js`.

## Tests

```bash
npm test
```

Incluye pruebas de scope por cargo, parser CSV, deduplicacion por hash y endpoint protegido sin sesion.
# kpi-jefaturas
