const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Find user by ID
 */
async function findUserById(id) {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

/**
 * Find user by email (for login / lookup)
 */
async function findUserByEmail(email) {
  return User.findOne({ email: email.toLowerCase() });
}

/**
 * Create a new user
 */
async function createUser({ name, email, password, role = 'company_admin', companyId = null }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError('Email already registered', 400);

  const user = await User.create({ name, email: email.toLowerCase(), password, role, companyId });
  return user;
}

/**
 * Update user details (safe fields only)
 */
async function updateUser(id, updates) {
  const allowed = ['name', 'password']; // restrict what can be updated directly
  const filtered = Object.keys(updates)
    .filter((key) => allowed.includes(key))
    .reduce((obj, key) => ({ ...obj, [key]: updates[key] }), {});

  const user = await User.findByIdAndUpdate(id, filtered, { new: true });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

/**
 * Delete user
 */
async function deleteUser(id) {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new AppError('User not found', 404);
  return true;
}

module.exports = {
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
  deleteUser,
};
