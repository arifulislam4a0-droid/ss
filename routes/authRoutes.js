const router = require('express').Router();
const authController = require('../controllers/authController');
const authUser = require('../middlewares/authUser');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authUser, authController.me);

module.exports = router;
