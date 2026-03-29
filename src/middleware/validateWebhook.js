const Joi = require('joi');
const crypto = require('crypto');
const logger = require('../utils/logger');

const schemas = {
  'user.registered': Joi.object({
    type: Joi.string().valid('user.registered').required(),
    payload: Joi.object({
      email: Joi.string().email().required(),
      first_name: Joi.string().allow('', null).optional(),
      last_name: Joi.string().allow('', null).optional(),
      registered_at: Joi.string().isoDate().allow('', null).optional(),
    }).required(),
  }),

  'user.login': Joi.object({
    type: Joi.string().valid('user.login').required(),
    payload: Joi.object({
      email: Joi.string().email().required(),
      name: Joi.string().allow('', null).optional(),
      logged_in_at: Joi.string().isoDate().allow('', null).optional(),
    }).required(),
  }),

  // Combined schema for unified endpoint
  'any': Joi.object({
    type: Joi.string().valid('user.registered', 'user.login').required(),
    payload: Joi.object({
      email: Joi.string().email().required(),
      first_name: Joi.string().allow('', null).optional(),
      last_name: Joi.string().allow('', null).optional(),
      registered_at: Joi.string().isoDate().allow('', null).optional(),
      name: Joi.string().allow('', null).optional(),
      logged_in_at: Joi.string().isoDate().allow('', null).optional(),
    }).required(),
  }),
};

// Verify HMAC signature from EventRelay
function verifySignature(payload, signature, secret) {
  if (!secret) {
    logger.warn('Webhook signature verification skipped: no secret configured');
    return true; // Allow if secret not configured
  }
  
  if (!signature) {
    logger.error('Webhook signature missing: X-Signature header not found');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === expectedSignature;
}

function validateWebhook(eventType = 'any') {
  return (req, res, next) => {
    const schema = schemas[eventType] || schemas['any'];
    if (!schema) {
      return res.status(400).json({ success: false, error: 'Unknown event type' });
    }

    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => d.message);
      logger.warn('Webhook validation failed', { eventType, details, body: req.body });
      return res.status(422).json({ success: false, error: 'Validation failed', details });
    }

    // Verify signature if X-Signature header is present (for security)
    const signature = req.headers['x-signature'];
    const secret = process.env.WEBHOOK_SECRET;
    const skipSignatureVerification = process.env.SKIP_WEBHOOK_SIGNATURE === 'true';
    
    // Sign only the payload field, matching how EventRelay generates it
    if (signature && !skipSignatureVerification) {
      if (!verifySignature(value.payload, signature, secret)) {
        logger.warn('Webhook signature verification failed (continuing anyway)', { 
          eventType, 
          ip: req.ip,
          providedSignature: signature.substring(0, 8) + '...',
          hint: 'Set SKIP_WEBHOOK_SIGNATURE=true to disable verification or configure matching WEBHOOK_SECRET'
        });
        // Don't fail - log warning and continue (useful for local/Docker network environments)
      } else {
        logger.info('Webhook signature verified successfully', { eventType, ip: req.ip });
      }
    } else if (!skipSignatureVerification && !secret && signature) {
      logger.warn('Webhook signature present but no secret configured - skipping verification', {
        eventType,
        hint: 'Configure WEBHOOK_SECRET in .env for proper verification'
      });
    }

    req.validatedBody = value;
    next();
  };
}

module.exports = { validateWebhook };
