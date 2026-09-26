# API Maestro-Detalle con Catálogo y Control de Estado

API REST + frontend para el reto de "misiones". Un solo POST registra al estudiante
(maestro) y su lista de misiones con estado (detalle), contra una base de datos SQL Server
ya existente (tablas `Estudiantes`, `Misiones`, `EstudianteMisiones`).

**Estudiante:** Maryori Rachael Fajardo Paredes — Carné 1890-23-18949

## Stack

- Node.js + Express 5
- `mssql` (driver oficial de SQL Server)
- Frontend estático (HTML/CSS/JS sin frameworks) servido por el mismo Express

## Estructura

```
server.js               # entry point
src/
  config/db.js           # pool de conexión a SQL Server
  services/               # lógica de negocio (transacciones, validaciones)
  controllers/            # handlers HTTP
  routes/                 # definición de rutas /api/*
  middlewares/errorHandler.js
public/                  # frontend (tablero de misiones)
```

## Configuración

1. Copiar `.env.example` a `.env` y completar con las credenciales de la base de datos:

   ```
   DB_USER=...
   DB_PASSWORD=...
   DB_SERVER=...
   DB_DATABASE=...
   DB_PORT=1433
   PORT=3000
   ```

2. Instalar dependencias y levantar el servidor:

   ```bash
   npm install
   npm run dev     # con recarga automática (nodemon)
   npm start        # producción
   ```

3. Abrir `http://localhost:3000` para ver el tablero.

## Endpoints

### `POST /api/registro`

Recibe el JSON maestro-detalle y hace upsert transaccional:

- Si el `carnet` no existe en `Estudiantes` → lo inserta.
- Si ya existe → actualiza `Nombre` y `Correo`.
- Por cada elemento de `detalle`:
  - Valida que `misionId` exista en el catálogo `Misiones`. Si no existe, la transacción
    se revierte y responde `400` con `code: "REFERENCE_ERROR"`.
  - Si no existe el par `(Carnet, MisionID)` en `EstudianteMisiones` → lo inserta.
  - Si ya existe → actualiza `Estado` y `FechaRegistro`.

```json
{
  "maestro": {
    "carnet": "1890-23-18949",
    "nombre": "MARYORI RACHAEL FAJARDO PAREDES",
    "correo": "mfajardop1@miumg.edu.gt"
  },
  "detalle": [
    { "misionId": 1, "estado": true },
    { "misionId": 2, "estado": false }
  ]
}
```

Respuestas: `200` éxito, `400` validación o referencia inválida, `409` correo duplicado.

### `GET /api/misiones`

Devuelve el catálogo completo de misiones (`MisionID`, `Nombre`, `Descripcion`).

### `GET /api/estudiantes`

Devuelve todos los estudiantes con sus misiones y estado, más un resumen de avance
(`completadas` / `totalMisiones`) usado por el tablero.

### `GET /api/estudiantes/:carnet`

Detalle de un estudiante puntual con el catálogo completo de misiones y su estado
(`estado: null` si aún no la ha reportado).

## Modelo de datos (ya existente en la BD)

- `Estudiantes(Carnet PK, Nombre, Correo UNIQUE)`
- `Misiones(MisionID PK IDENTITY, Nombre UNIQUE, Descripcion)`
- `EstudianteMisiones(DetalleID PK IDENTITY, Carnet FK, MisionID FK, Estado BIT, FechaRegistro)`
  con `UNIQUE (Carnet, MisionID)`.

## Despliegue

- Backend: cualquier hosting Node (Render, Railway, Azure App Service, Fly.io). Configurar
  las mismas variables de `.env` como variables de entorno del servicio.
- Frontend: se sirve desde el mismo backend (`public/`), así que no requiere un hosting
  aparte. Si se prefiere GitHub Pages para el frontend, ajustar `API_BASE` en
  `public/app.js` a la URL pública del backend.
- Subir el repositorio a GitHub antes de desplegar.
