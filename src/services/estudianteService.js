const { sql, getPool } = require('../config/db');

async function listarEstudiantesConMisiones() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT e.Carnet, e.Nombre, e.Correo,
           m.MisionID, m.Nombre AS MisionNombre, m.Descripcion AS MisionDescripcion,
           em.Estado, em.FechaRegistro
    FROM Estudiantes e
    LEFT JOIN EstudianteMisiones em ON em.Carnet = e.Carnet
    LEFT JOIN Misiones m ON m.MisionID = em.MisionID
    ORDER BY e.Carnet, m.MisionID
  `);

  const porCarnet = new Map();

  for (const row of result.recordset) {
    if (!porCarnet.has(row.Carnet)) {
      porCarnet.set(row.Carnet, {
        carnet: row.Carnet,
        nombre: row.Nombre,
        correo: row.Correo,
        misiones: []
      });
    }
    if (row.MisionID != null) {
      porCarnet.get(row.Carnet).misiones.push({
        misionId: row.MisionID,
        nombre: row.MisionNombre,
        descripcion: row.MisionDescripcion,
        estado: row.Estado,
        fechaRegistro: row.FechaRegistro
      });
    }
  }

  return [...porCarnet.values()].map((estudiante) => ({
    ...estudiante,
    completadas: estudiante.misiones.filter((m) => m.estado === true).length,
    totalMisiones: estudiante.misiones.length
  }));
}

async function obtenerPorCarnet(carnet) {
  const pool = await getPool();
  const estudiante = await pool
    .request()
    .input('carnet', sql.VarChar(25), carnet)
    .query('SELECT Carnet, Nombre, Correo FROM Estudiantes WHERE Carnet = @carnet');

  if (estudiante.recordset.length === 0) return null;

  const misiones = await pool.request().input('carnet', sql.VarChar(25), carnet).query(`
      SELECT m.MisionID, m.Nombre, m.Descripcion, em.Estado, em.FechaRegistro
      FROM Misiones m
      LEFT JOIN EstudianteMisiones em ON em.MisionID = m.MisionID AND em.Carnet = @carnet
      ORDER BY m.MisionID
    `);

  return {
    ...estudiante.recordset[0],
    misiones: misiones.recordset
  };
}

module.exports = { listarEstudiantesConMisiones, obtenerPorCarnet };
