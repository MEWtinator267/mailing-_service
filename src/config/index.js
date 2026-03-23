require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  app: {
    name: process.env.APP_NAME || 'MyApp',
    dashboardUrl: process.env.APP_DASHBOARD_URL || 'https://app.company.com/dashboard',
    logoUrl: process.env.APP_LOGO_URL || '',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'mailing_service',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  email: {
    fromEmail: process.env.FROM_EMAIL || 'noreply@company.com',
    fromName: process.env.FROM_NAME || 'Company Name',
  },
  offers: {
    dataSource: process.env.OFFERS_DATA_SOURCE || 'database',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  retry: {
    delays: [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000], // 5min, 15min, 1hr
    maxAttempts: 3,
  },
};
