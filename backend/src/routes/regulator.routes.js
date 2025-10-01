const express = require('express');
const router = express.Router();
const regulatorController = require('../controllers/regulator.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// Create new regulator (later: only super_admin should do this)
router.post('/', requireAuth(['super_admin']), regulatorController.createRegulator);

// List all regulators
router.get('/', requireAuth(['super_admin','regulator_admin']), regulatorController.listRegulators);

// Get single regulator
router.get('/:id', requireAuth(['super_admin', 'regulator_admin']), regulatorController.getRegulator);

module.exports = router;
