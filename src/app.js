require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database');
const logger = require('./utils/logger');
const config = require('./config');
const webhookRoutes = require('./routes/webhook');

// Import models so Sequelize registers them
require('./models/EmailLog');
require('./models/Offer');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Routes
app.use('/webhook', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'mailing-service',
    timestamp: new Date().toISOString(),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');

    await sequelize.sync({ alter: false });
    logger.info('Database models synced');

    // Initialize queue worker (import triggers registration)
    require('./queues/emailQueue');
    logger.info('Email queue worker started');

    app.listen(config.port, () => {
      logger.info(`Mailing service listening on port ${config.port}`, {
        env: config.nodeEnv,
        port: config.port,
      });
    });
  } catch (err) {
    logger.error('Failed to start service', { error: err.message, stack: err.stack });
    console.error('STARTUP ERROR:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
