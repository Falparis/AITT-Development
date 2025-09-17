const regulatorService = require('../services/regulator.service');
const logger = require('../utils/logger');

async function createRegulator(req, res, next) {
  try {
    const data = req.body;
    const regulator = await regulatorService.createRegulator(data);
    logger.info('Regulator created', { regulatorId: regulator._id });
    res.status(201).json({ success: true, data: regulator });
  } catch (err) {
    logger.error('Regulator creation failed', { error: err.message });
    next(err);
  }
}

async function listRegulators(req, res, next) {
  try {
    const regulators = await regulatorService.listRegulators();
    res.json({ success: true, data: regulators });
  } catch (err) {
    next(err);
  }
}

async function getRegulator(req, res, next) {
  try {
    const { id } = req.params;
    const regulator = await regulatorService.getRegulatorById(id);
    if (!regulator) return res.status(404).json({ success: false, message: 'Regulator not found' });
    res.json({ success: true, data: regulator });
  } catch (err) {
    next(err);
  }
}

module.exports = { createRegulator, listRegulators, getRegulator };
