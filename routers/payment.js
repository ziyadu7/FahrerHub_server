const express  = require('express')
const paymentController = require('../controllers/payment')
const auth = require('../middlewares/auth')

const router = express.Router()

router.post('/create-checkout-session',auth.verifyUserToken,paymentController.createCheckoute)

// router.post('/webhook',express.raw({type: 'application/json'}),paymentController.webhook);

module.exports = router