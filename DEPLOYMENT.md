# KPI Jefaturas Deployment

## Local

```powershell
npm install
npm run db:migrate
npm run db:seed
npm run import:csv -- "C:\App\Joel\07_kpi_jefaturas\048 KPIs Jefaturas 260807 122334.csv"
npm run dev
```

Local usa SQLite con `DATABASE_URL=file:./dev.db`, relativo a `backend/prisma`.

Para sincronizar desde archivo local sin Microsoft 365:

```env
KPI_SOURCE=local
KPI_LOCAL_FILE_PATH=C:\ruta\al\kpis.csv
```

El backend importa el CSV al arrancar y luego revisa cada `KPI_SYNC_INTERVAL_MS`.

## Docker Local

```powershell
docker compose up --build
```

Por defecto el compose no ejecuta seed. Para crear usuarios iniciales de prueba de forma deliberada:

```powershell
$env:BOOTSTRAP_SEED="true"
docker compose up --build
```

El compose monta:

- `./data` -> `/data`
- `./048 KPIs Jefaturas 260807 122334.csv` -> `/app/local-csv/kpis.csv`

La app queda en:

```text
http://localhost:4000
```

La API queda en:

```text
http://localhost:4000/api
```

## Railway

No desplegar todavia hasta tener variables definitivas.

Cuando se despliegue:

1. Conectar el repositorio en Railway.
2. Railway detecta el `Dockerfile`.
3. Crear un Volume.
4. Montar el Volume en `/data`.
5. Configurar `DATABASE_URL=file:/data/kpi.db`.
6. Configurar `PORT` con el valor que entregue Railway.
7. Configurar healthcheck en `/api/health`.
8. Mantener una sola replica mientras se use SQLite.
9. No configurar `BOOTSTRAP_SEED=true` salvo un bootstrap inicial deliberado.

SQLite persistente vivira en:

```text
/data/kpi.db
```

`BOOTSTRAP_SEED` tiene default seguro `false`. Cuando se activa, el seed crea usuarios faltantes, pero no reescribe usuarios existentes ni resetea contrasenas.

## OneDrive / SharePoint

La app no depende de OneDrive para arrancar. Si `KPI_SOURCE=onedrive` pero faltan variables, el servidor sigue vivo y el dashboard usa el ultimo dataset valido en SQLite.

Variables pendientes de Microsoft:

```env
KPI_SOURCE=onedrive
MS_TENANT_ID=
MS_CLIENT_ID=
MS_CLIENT_SECRET=
ONEDRIVE_DRIVE_ID=
ONEDRIVE_ITEM_ID=
```

Alternativa por usuario y ruta:

```env
ONEDRIVE_USER_ID=
ONEDRIVE_FILE_PATH=/KPI_JEFATURAS/kpis.csv
```

No se guardan copias permanentes del CSV. El archivo se descarga en memoria, se valida, se importa a SQLite y se libera.

## Importacion KPI

El CSV es la fuente de verdad. La app no recalcula:

- Resultado
- Objetivo
- Valor Real
- Calificacion
- Calificacion General
- Acumulado
- Trimestres
- Semestres
- Tendencia
- Parametros

Nuevo CSV valido:

1. Validar estructura.
2. Abrir transaccion.
3. Reemplazar solo `KpiResultado`.
4. Insertar dataset nuevo.
5. Confirmar transaccion.

CSV invalido:

- Se registra el fallo.
- No cambia el dataset KPI vigente.
- No se actualiza el eTag como importado correcto.

## Sync

Endpoints admin:

```text
GET  /api/admin/kpi-sync/status
POST /api/admin/kpi-sync/run
```

El sync usa un lock en proceso. Si ya hay una sincronizacion en curso, una segunda ejecucion se omite.

Si OneDrive falla, la API y el dashboard siguen funcionando con SQLite.
