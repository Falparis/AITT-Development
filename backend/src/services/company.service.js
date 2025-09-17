// src/services/company.service.js
const Company = require('../models/Company');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Create a company. If session provided, this will be created inside that session.
 * @param {Object} companyData
 * @param {Object} options - { session }
 */
async function createCompany(companyData, options = {}) {
  try {
    if (!companyData || !companyData.name) {
      throw new AppError(400, 'Company name is required');
    }

    if (options.session) {
      // create as array to use session
      const [doc] = await Company.create([companyData], { session: options.session });
      logger.info('Company created (session)', { companyId: doc._id, name: doc.name });
      return doc;
    }

    const doc = await Company.create(companyData);
    logger.info('Company created', { companyId: doc._id, name: doc.name });
    return doc;
  } catch (err) {
    logger.error('createCompany failed', { err: err.message });
    if (err instanceof AppError) throw err;
    throw new AppError(500, 'Failed to create company', err.message);
  }
}

async function getCompanyById(id) {
  const doc = await Company.findById(id);
  if (!doc) throw new AppError(404, 'Company not found');
  return doc;
}

async function listCompanies({ skip = 0, limit = 50, q = '' } = {}) {
  const filter = {};
  if (q) filter.$text = { $search: q };
  const docs = await Company.find(filter).skip(parseInt(skip, 10)).limit(Math.min(100, limit));
  return docs;
}

module.exports = { createCompany, getCompanyById, listCompanies };
