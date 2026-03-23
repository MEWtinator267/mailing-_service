const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailLog = sequelize.define('EmailLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true },
  },
  event_type: {
    type: DataTypes.ENUM('user.registered', 'user.login'),
    allowNull: false,
  },
  email_subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('sent', 'failed', 'bounced', 'pending'),
    defaultValue: 'pending',
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  retry_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  message_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'email_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = EmailLog;
