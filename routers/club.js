const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const clubController = require('../controllers/club')
const multer = require('../config/multer')
const upload = multer.createMulter();


router.get('/home/:id',auth.verifyUserToken,clubController.loadClubHome)
router.patch('/exitClub',auth.verifyClubMemberToken,clubController.exitClub)
router.post('/createRide',auth.verifyClubMemberToken,upload.single('image'),clubController.createRide)
router.get('/getRides',auth.verifyClubMemberToken,clubController.getRides)
router.get('/getImages',auth.verifyClubMemberToken,clubController.getImages)
router.get('/singleRide/:rideId',auth.verifyClubMemberToken,clubController.loadSingleRide)
router.patch('/joinRide',auth.verifyClubMemberToken,clubController.joinRide)
router.patch('/confirmRide',auth.verifyClubMemberToken,clubController.confirmRide)
router.patch('/removeRider',auth.verifyClubMemberToken,clubController.removeRider)
router.get('/rideHistory',auth.verifyClubMemberToken,clubController.rideHistory)
router.patch('/leftRide',auth.verifyClubMemberToken,clubController.leftRide)
router.get('/getRiders',auth.verifyClubMemberToken,clubController.getRiders)

module.exports = router
