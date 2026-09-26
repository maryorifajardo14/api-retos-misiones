const express = require('express');
const { postRegistro } = require('../controllers/registroController');
const { getMisiones } = require('../controllers/misionesController');
const { getEstudiantes, getEstudiantePorCarnet } = require('../controllers/estudiantesController');

const router = express.Router();

router.post('/registro', postRegistro);
router.get('/misiones', getMisiones);
router.get('/estudiantes', getEstudiantes);
router.get('/estudiantes/:carnet', getEstudiantePorCarnet);

module.exports = router;
