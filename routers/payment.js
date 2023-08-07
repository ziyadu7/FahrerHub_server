const express  = require('express')
const paymentController = require('../controllers/payment')
const auth = require('../middlewares/auth')

const router = express.Router()

router.post('/create-checkout-session',auth.verifyUserToken,paymentController.createCheckoute)

module.exports = router