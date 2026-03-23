const sequelize = require('../config/database');
const EmailLog = require('../models/EmailLog');
const Offer = require('../models/Offer');
const logger = require('../utils/logger');

async function migrate() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    await sequelize.sync({ alter: true });
    logger.info('Database tables synced successfully');

    process.exit(0);
  } catch (err) {
    logger.error('Migration failed', { error: err.message });
    process.exit(1);
  }
}

migrate();
