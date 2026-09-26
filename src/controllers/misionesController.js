const misionService = require('../services/misionService');

async function getMisiones(req, res, next) {
  try {
    const misiones = await misionService.listarCatalogo();
    res.status(200).json(misiones);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMisiones };
