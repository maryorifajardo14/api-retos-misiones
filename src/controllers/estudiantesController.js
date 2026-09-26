const estudianteService = require('../services/estudianteService');

async function getEstudiantes(req, res, next) {
  try {
    const estudiantes = await estudianteService.listarEstudiantesConMisiones();
    res.status(200).json(estudiantes);
  } catch (err) {
    next(err);
  }
}

async function getEstudiantePorCarnet(req, res, next) {
  try {
    const estudiante = await estudianteService.obtenerPorCarnet(req.params.carnet);
    if (!estudiante) {
      return res.status(404).json({ ok: false, message: 'Estudiante no encontrado.' });
    }
    res.status(200).json(estudiante);
  } catch (err) {
    next(err);
  }
}

module.exports = { getEstudiantes, getEstudiantePorCarnet };
