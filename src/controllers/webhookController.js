const { v4: uuidv4 } = require('uuid');
const EmailLog = require('../models/EmailLog');
const { enqueueEmail } = require('../queues/emailQueue');
const logger = require('../utils/logger');
const config = require('../config');

async function handleUserRegistered(req, res) {
  const { payload } = req.validatedBody;

  const subject = `Welcome to ${config.app.name}! 🎉`;
  const logId = uuidv4();

  console.log(`📧 [MAIL] user.registered webhook received for: ${payload.email}`);

  let log;
  try {
    log = await EmailLog.create({
      id: logId,
      user_email: payload.email,
      event_type: 'user.registered',
      email_subject: subject,
      status: 'pending',
      retry_count: 0,
    });
  } catch (dbErr) {
    logger.error('Failed to create email log', { error: dbErr.message, email: payload.email });
    console.error(`❌ [MAIL] Failed to create log for ${payload.email}: ${dbErr.message}`);
    return res.status(500).json({ success: false, error: 'Internal error creating email log' });
  }

  try {
    const job = await enqueueEmail({
      logId: log.id,
      eventType: 'user.registered',
      payload,
    });

    logger.info('user.registered webhook processed', {
      email: payload.email,
      logId: log.id,
      jobId: job.id,
    });

    console.log(`✅ [MAIL] Welcome email queued for ${payload.email} (Job: ${job.id})`);

    return res.status(200).json({
      success: true,
      message: 'Welcome email queued',
      log_id: log.id,
    });
  } catch (queueErr) {
    logger.error('Failed to enqueue email', { error: queueErr.message, logId: log.id });
    console.error(`❌ [MAIL] Failed to queue email for ${payload.email}: ${queueErr.message}`);
    await log.update({ status: 'failed', error_message: queueErr.message });
    return res.status(500).json({ success: false, error: 'Failed to queue email' });
  }
}

async function handleUserLogin(req, res) {
  const { payload } = req.validatedBody;

  const subject = `Exclusive Offers Just for You 🎁`;
  const logId = uuidv4();

  console.log(`📧 [MAIL] user.login webhook received for: ${payload.email}`);

  let log;
  try {
    log = await EmailLog.create({
      id: logId,
      user_email: payload.email,
      event_type: 'user.login',
      email_subject: subject,
      status: 'pending',
      retry_count: 0,
    });
  } catch (dbErr) {
    logger.error('Failed to create email log', { error: dbErr.message, email: payload.email });
    console.error(`❌ [MAIL] Failed to create log for ${payload.email}: ${dbErr.message}`);
    return res.status(500).json({ success: false, error: 'Internal error creating email log' });
  }

  try {
    const job = await enqueueEmail({
      logId: log.id,
      eventType: 'user.login',
      payload,
    });

    logger.info('user.login webhook processed', {
      email: payload.email,
      logId: log.id,
      jobId: job.id,
    });

    console.log(`✅ [MAIL] Offers email queued for ${payload.email} (Job: ${job.id})`);

    return res.status(200).json({
      success: true,
      message: 'Offers email queued',
      log_id: log.id,
    });
  } catch (queueErr) {
    logger.error('Failed to enqueue email', { error: queueErr.message, logId: log.id });
    console.error(`❌ [MAIL] Failed to queue email for ${payload.email}: ${queueErr.message}`);
    await log.update({ status: 'failed', error_message: queueErr.message });
    return res.status(500).json({ success: false, error: 'Failed to queue email' });
  }
}

module.exports = { handleUserRegistered, handleUserLogin };
