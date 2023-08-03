const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const clubAdminController = require('../controllers/clubAdmin')

router.get('/getClub',auth.verifyClubAdminToken,clubAdminController.getClub)
router.get('/getMembers',auth.verifyClubAdminToken,clubAdminController.getMembers)
router.patch('/removeMember',auth.verifyClubAdminToken,clubAdminController.removeMember)
router.patch('/editClub',auth.verifyClubAdminToken,clubAdminController.editClub)
router.post('/addImage',auth.verifyClubAdminToken,clubAdminController.addImage)
router.get('/getImages',auth.verifyClubAdminToken,clubAdminController.getImages)
router.patch('/removeImage',auth.verifyClubAdminToken,clubAdminController.removeImage)
router.post('/blockRide',auth.verifyClubAdminToken,clubAdminController.blockRide)
router.patch('/unBlockRide',auth.verifyClubAdminToken,clubAdminController.unBlockRide)
router.delete('/cancelRide',auth.verifyClubAdminToken,clubAdminController.cancelRide)
router.patch('/allowRide',auth.verifyClubAdminToken,clubAdminController.allowRide)
router.patch('/requestManage',auth.verifyClubAdminToken,clubAdminController.requestManage)

module.exports = router
