const Joi = require('joi');
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

    // No signature verification - schema validation is enough
    req.validatedBody = value;
    next();
  };
}

module.exports = { validateWebhook };
