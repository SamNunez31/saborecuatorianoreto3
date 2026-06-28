const router = require('express').Router();
const ctrl   = require('../controllers/unidad.controller');

router.get('/', ctrl.getAll);

module.exports = router;
