const express = require('express');
const router = express.Router();
const { validateWebhook } = require('../middleware/validateWebhook');
const { handleUserRegistered, handleUserLogin } = require('../controllers/webhookController');

router.post('/user-registered', validateWebhook('user.registered'), handleUserRegistered);
router.post('/user-login', validateWebhook('user.login'), handleUserLogin);

module.exports = router;
