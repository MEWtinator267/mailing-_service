const Bull = require('bull');
const config = require('../config');
const logger = require('../utils/logger');
const { sendWelcomeEmail, sendOffersEmail } = require('../services/emailService');
const { getActiveOffers } = require('../services/offerService');
const EmailLog = require('../models/EmailLog');

const redisConfig = {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  },
};

const emailQueue = new Bull('email-queue', redisConfig);

// Retry delays: 5min, 15min, 1hr
const RETRY_DELAYS = config.retry.delays;
const MAX_ATTEMPTS = config.retry.maxAttempts;

emailQueue.process(async (job) => {
  const { logId, eventType, payload } = job.data;

  const log = await EmailLog.findByPk(logId);
  if (!log) throw new Error(`EmailLog ${logId} not found`);

  try {
    let info;

    if (eventType === 'user.registered') {
      info = await sendWelcomeEmail(payload);
    } else if (eventType === 'user.login') {
      const offers = await getActiveOffers();
      info = await sendOffersEmail({ ...payload, offers });
    } else {
      throw new Error(`Unknown event type: ${eventType}`);
    }

    await log.update({
      status: 'sent',
      sent_at: new Date(),
      message_id: info.messageId,
      error_message: null,
    });

    logger.info('Email job completed', { logId, eventType, messageId: info.messageId });
    return { messageId: info.messageId };
  } catch (err) {
    await log.update({
      retry_count: log.retry_count + 1,
      error_message: err.message,
    });
    throw err; // Re-throw so Bull marks job as failed and triggers retry
  }
});

emailQueue.on('failed', async (job, err) => {
  const { logId, eventType } = job.data;
  logger.error('Email job failed', {
    logId,
    eventType,
    attempt: job.attemptsMade,
    error: err.message,
  });

  if (job.attemptsMade >= MAX_ATTEMPTS) {
    await EmailLog.update(
      { status: 'failed' },
      { where: { id: logId } }
    );
    logger.error('Max retries reached, marking email as failed', { logId });
  }
});

emailQueue.on('completed', (job) => {
  logger.info('Email queue job completed', { jobId: job.id });
});

/**
 * Enqueue an email job with exponential backoff retry.
 * Base delay is 5 minutes; Bull doubles it on each retry (5min → 10min → 20min).
 * With MAX_ATTEMPTS=3 this gives: immediate, +5min, +10min.
 */
async function enqueueEmail({ logId, eventType, payload }) {
  const job = await emailQueue.add(
    { logId, eventType, payload },
    {
      attempts: MAX_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: RETRY_DELAYS[0],
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  logger.info('Email job enqueued', { jobId: job.id, logId, eventType });
  return job;
}

module.exports = { emailQueue, enqueueEmail };
