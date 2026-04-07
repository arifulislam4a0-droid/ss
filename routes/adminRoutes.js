const router = require('express').Router();
const adminController = require('../controllers/adminController');
const authAdmin = require('../middlewares/authAdmin');

router.post('/login', adminController.login);
router.get('/dashboard', authAdmin, adminController.dashboard);
router.put('/payment-methods', authAdmin, adminController.updatePaymentMethods);
router.get('/user-offer', authAdmin, adminController.findUserOffer);
router.put('/user-offer/:id', authAdmin, adminController.updateUserOffer);
router.get('/requests', authAdmin, adminController.requests);
router.post('/deposits/:id/process', authAdmin, adminController.processDeposit);
router.post('/withdraws/:id/process', authAdmin, adminController.processWithdraw);

module.exports = router;
