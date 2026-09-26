const registroService = require('../services/registroService');

async function postRegistro(req, res, next) {
  try {
    const resultado = await registroService.registrar(req.body);
    res.status(200).json({ ok: true, ...resultado });
  } catch (err) {
    next(err);
  }
}

module.exports = { postRegistro };
