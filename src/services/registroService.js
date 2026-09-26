const { sql, getPool } = require('../config/db');
const { AppError } = require('../utils/errors');

function validarPayload(body) {
  const { maestro, detalle } = body || {};

  if (!maestro || typeof maestro !== 'object') {
    throw new AppError('El campo "maestro" es obligatorio.', 400, 'VALIDATION_ERROR');
  }
  const { carnet, nombre, correo } = maestro;
  if (!carnet || typeof carnet !== 'string' || carnet.length > 25) {
    throw new AppError('El carnet es obligatorio y debe tener máximo 25 caracteres.', 400, 'VALIDATION_ERROR');
  }
  if (!nombre || typeof nombre !== 'string') {
    throw new AppError('El nombre es obligatorio.', 400, 'VALIDATION_ERROR');
  }
  if (!correo || typeof correo !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    throw new AppError('El correo es obligatorio y debe tener un formato válido.', 400, 'VALIDATION_ERROR');
  }
  if (!Array.isArray(detalle)) {
    throw new AppError('El campo "detalle" debe ser un arreglo de misiones.', 400, 'VALIDATION_ERROR');
  }
  for (const item of detalle) {
    if (!item || typeof item.misionId !== 'number' || typeof item.estado !== 'boolean') {
      throw new AppError('Cada elemento de "detalle" requiere misionId (numero) y estado (boolean).', 400, 'VALIDATION_ERROR');
    }
  }
}

async function registrar(body) {
  validarPayload(body);
  const { maestro, detalle } = body;
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();
  try {
    if (detalle.length > 0) {
      const catalogo = await new sql.Request(transaction).query('SELECT MisionID FROM Misiones');
      const idsValidos = new Set(catalogo.recordset.map((r) => r.MisionID));
      const idsInvalidos = [...new Set(detalle.map((d) => d.misionId))].filter((id) => !idsValidos.has(id));
      if (idsInvalidos.length > 0) {
        throw new AppError(
          `Error de referencia: los siguientes misionId no existen en el catálogo de Misiones: ${idsInvalidos.join(', ')}`,
          400,
          'REFERENCE_ERROR'
        );
      }
    }

    const existente = await new sql.Request(transaction)
      .input('carnet', sql.VarChar(25), maestro.carnet)
      .query('SELECT Carnet FROM Estudiantes WHERE Carnet = @carnet');

    if (existente.recordset.length === 0) {
      await new sql.Request(transaction)
        .input('carnet', sql.VarChar(25), maestro.carnet)
        .input('nombre', sql.NVarChar(150), maestro.nombre)
        .input('correo', sql.NVarChar(150), maestro.correo)
        .query('INSERT INTO Estudiantes (Carnet, Nombre, Correo) VALUES (@carnet, @nombre, @correo)');
    } else {
      await new sql.Request(transaction)
        .input('carnet', sql.VarChar(25), maestro.carnet)
        .input('nombre', sql.NVarChar(150), maestro.nombre)
        .input('correo', sql.NVarChar(150), maestro.correo)
        .query('UPDATE Estudiantes SET Nombre = @nombre, Correo = @correo WHERE Carnet = @carnet');
    }

    for (const item of detalle) {
      const detalleExistente = await new sql.Request(transaction)
        .input('carnet', sql.VarChar(25), maestro.carnet)
        .input('misionId', sql.Int, item.misionId)
        .query('SELECT DetalleID FROM EstudianteMisiones WHERE Carnet = @carnet AND MisionID = @misionId');

      if (detalleExistente.recordset.length === 0) {
        await new sql.Request(transaction)
          .input('carnet', sql.VarChar(25), maestro.carnet)
          .input('misionId', sql.Int, item.misionId)
          .input('estado', sql.Bit, item.estado)
          .query(
            'INSERT INTO EstudianteMisiones (Carnet, MisionID, Estado, FechaRegistro) VALUES (@carnet, @misionId, @estado, GETDATE())'
          );
      } else {
        await new sql.Request(transaction)
          .input('carnet', sql.VarChar(25), maestro.carnet)
          .input('misionId', sql.Int, item.misionId)
          .input('estado', sql.Bit, item.estado)
          .query('UPDATE EstudianteMisiones SET Estado = @estado, FechaRegistro = GETDATE() WHERE Carnet = @carnet AND MisionID = @misionId');
      }
    }

    await transaction.commit();
    return { carnet: maestro.carnet, misionesProcesadas: detalle.length };
  } catch (err) {
    try {
      await transaction.rollback();
    } catch (_) {
      /* la transacción ya pudo haberse cerrado */
    }

    if (err instanceof AppError) throw err;

    if (err.number === 2627 || err.number === 2601) {
      throw new AppError('El correo ya está registrado para otro carnet.', 409, 'DUPLICATE_ERROR');
    }

    throw err;
  }
}

module.exports = { registrar };
