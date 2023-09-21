const express = require('express')
const router = express.Router()
const superAdminController = require('../controllers/superAdmin')
const auth = require('../middlewares/auth')
const multer = require('../config/multer')
const upload = multer.createMulter();
  

router.post('/login',superAdminController.login)
router.get('/showBikes',auth.verifySuperAdminToken,superAdminController.showBikes)
router.get('/getEditBike/:id',auth.verifySuperAdminToken,superAdminController.getEditBike)
router.patch('/editBike/:id',auth.verifySuperAdminToken,upload.array('images',4),superAdminController.editBike)
router.patch('/blockClub',auth.verifySuperAdminToken,superAdminController.blockClub)
router.patch('/userStatus',auth.verifySuperAdminToken,superAdminController.userStatus)
router.post('/addBike',auth.verifySuperAdminToken,upload.array('images',4),superAdminController.addBikes)
router.delete('/removeBike/:id',auth.verifySuperAdminToken,superAdminController.removeBike)
router.get('/clubs',auth.verifySuperAdminToken,superAdminController.getClubs)
router.get('/rents',auth.verifySuperAdminToken,superAdminController.getRents)
router.get('/users',auth.verifySuperAdminToken,superAdminController.users)
router.get('/getDashbord',auth.verifySuperAdminToken,superAdminController.getDashbord)
router.get('/getLocations',auth.verifySuperAdminToken,superAdminController.getLocations)
router.post('/sentRentMail',auth.verifySuperAdminToken,superAdminController.sendRentMail)
router.post('/addLocation',auth.verifySuperAdminToken,superAdminController.addLocation)
router.delete('/removeLocation/:locationId',auth.verifySuperAdminToken,superAdminController.removeLocation)

module.exports = router