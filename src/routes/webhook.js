const express = require('express');
const router = express.Router();
const { validateWebhook } = require('../middleware/validateWebhook');
const { handleUserRegistered, handleUserLogin, handleEvents } = require('../controllers/webhookController');

// Unified endpoint - accepts both event types
router.post('/events', validateWebhook(), handleEvents);

// Legacy endpoints - kept for backward compatibility
router.post('/user-registered', validateWebhook('user.registered'), handleUserRegistered);
router.post('/user-login', validateWebhook('user.login'), handleUserLogin);

module.exports = router;
