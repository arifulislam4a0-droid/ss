const router = require('express').Router();
const authUser = require('../middlewares/authUser');
const userController = require('../controllers/userController');

router.use(authUser);
router.get('/profile', userController.profile);
router.post('/change-password', userController.changePassword);
router.get('/payment-methods', userController.paymentMethods);
router.post('/deposit', userController.createDeposit);
router.post('/withdraw', userController.createWithdraw);
router.get('/transactions', userController.transactions);
router.post('/spin', userController.spin);

module.exports = router;
