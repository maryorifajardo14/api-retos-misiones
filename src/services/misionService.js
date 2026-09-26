const { getPool } = require('../config/db');

async function listarCatalogo() {
  const pool = await getPool();
  const result = await pool.request().query('SELECT MisionID, Nombre, Descripcion FROM Misiones ORDER BY MisionID');
  return result.recordset;
}

module.exports = { listarCatalogo };
