const express  = require('express')
const auth = require('../middlewares/auth')
const chatController = require('../controllers/chatController')
const router = express.Router()

router.post('/accessChat',auth.verifyClubMemberToken,chatController.accessChat)
router.get('/getUsers/:rideId',auth.verifyClubMemberToken,chatController.getUsers)
router.post('/addMessage',auth.verifyClubMemberToken,chatController.addMessage)

module.exports = router