const userModel = require('../models/userModel')
const clubModel = require('../models/clubModel')
const rideModel = require('../models/rideModel')
const messageModel = require('../models/messageModel')
const sha256 = require('js-sha256')
const { default: mongoose } = require('mongoose')
const { generateClubToken } = require('../middlewares/auth')
const chatModel = require('../models/chatModel')
require('dotenv').config()


const loadClubHome = async (req, res) => {
    try {
        const clubId = req.params.id
        const userId = req.payload.id
        const club = await clubModel.findOne({ _id: clubId })
        const isAdmin = club.admins.some(adminObj => adminObj.admin.equals(new mongoose.Types.ObjectId(userId)))
        const member = club.members.some(memberObj => memberObj.member.equals(new mongoose.Types.ObjectId(userId)))
        if (club) {
            if (isAdmin) {
                const token = generateClubToken(userId, clubId, 'admin')
                res.status(200).json({ token, club, clubId, role: 'admin' })
            } else if (member) {
                const token = generateClubToken(userId, clubId, 'member')
                res.status(200).json({ token, club, clubId, role: "member" })
            } else {
                res.sta(403).json({ errMsg: 'You are not accepted' })
            }
        } else {
            res.status(404).json({ errMsg: "Club not found" })
        }
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}



const exitClub = async (req, res) => {
    try {
        const clubId = req.body.id
        const userId = req.payload.userId

        const ride = await rideModel.find({ club: clubId, 'riders.rider': userId })
        if (ride.length > 0) {
            res.status(409).json({ errMsg: 'You included in a ride first left from the ride' })
        } else {
            await clubModel.updateOne({ _id: clubId }, { $pull: { members: { member: userId } } })

            res.status(200).json({ message: 'Successfully exited' })
        }

    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}



//////////////////CREATE RIDE///////////////

const createRide = async (req, res) => {
    try {
        const { startDate, endDate, from, destination, maxRiders, description, image,fromLatitude,fromLongitude,toLatitude,toLongitude } = req.body
        const { userId, clubId, role } = req.payload

        const alreadyRider = await rideModel.findOne({
            riders: { $elemMatch: { rider: userId } },
            $or: [
                { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
                { startDate: { $gte: startDate, $lte: endDate } },
            ],
        })

        const alreadyHead = await rideModel.findOne({
            head: userId,
            $or: [
                { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
                { startDate: { $gte: startDate, $lte: endDate } },
            ],
        })
        if (alreadyRider || alreadyHead) {
            res.status(400).json({ errMsg: 'You have joined another ride between that date' })
        } else {
            const newRide = await rideModel.create({ startDate, endDate, from, destination, image, maxRiders, description, head: userId, club: clubId,'fromLocation.longitude':fromLongitude,'fromLocation.latitude':fromLatitude,'destinationLocation.longitude':toLongitude,'destinationLocation.latitude':toLatitude })
            if (role == 'admin') {
                await clubModel.updateOne({ _id: clubId, 'admins.admin': userId }, { $inc: { 'admins.$.rideCount': 1 } })
            } else {
                await clubModel.updateOne({ _id: clubId, 'members.member': userId }, { $inc: { 'members.$.rideCount': 1 } })
            }
            res.status(200).json({ message: "Ride Created Successfully" })
        }
    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}

/////////////LOAD RIDES//////////////

const getRides = async (req, res) => {
    try {
        const { clubId } = req.payload
        const admin = req.query.admin
        const currentDate = new Date()
        if (admin) {
            const rides = await rideModel.find({
                club: clubId,
                endDate: { $gt: currentDate }
            }).populate('head').populate('riders.rider').populate('club')
            res.status(200).json({ rides })
        } else {
            const rides = await rideModel.find({
                club: clubId,
                isBlocked: false,
                isAccepted: true,
                endDate: { $gt: currentDate }
            }).populate('head').populate('riders.rider').populate('club')
            res.status(200).json({ rides })
        }

    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}

///////////LOAD PAST RIDES///////////

const rideHistory = async (req, res) => {
    try {
        const { clubId } = req.payload
        const currentDate = new Date()
        const rides = await rideModel.find({
            club: clubId,
            endDate: { $lte: currentDate }
        }).populate('head').populate('riders.rider').populate('club')
        res.status(200).json({ rides })
    } catch (error) {
        console.log(error)
        res.status(500).json({ errMsg: 'Server Error' })
    }
}


////////////////LOAD SINGLE RIDE//////////////////

const loadSingleRide = async (req, res) => {
    try {
        const { rideId } = req.params
        const { userId } = req.payload

        const Joined = await rideModel.findOne({ _id: rideId, isBlocked: false, }, {})
        const isJoined = Joined.riders.some(rider => rider.rider.equals(new mongoose.Types.ObjectId(userId)))
        const rider = Joined.riders.filter((rider) => rider.rider.equals(new mongoose.Types.ObjectId(userId)))
        const isSure = rider[0]?.isSure
        const ride = await rideModel.findOne({ _id: rideId, isBlocked: false, }).populate('club').populate('head').populate('riders.rider')
        res.status(200).json({ ride, isJoined, isSure })

    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}



///////////////////JOIN RIDE/////////////////

const joinRide = async (req, res) => {
    try {
        const { rideId, isSure } = req.body
        const { userId, clubId, role } = req.payload

        const ride = await rideModel.findOne({ _id: rideId })
        if (ride.riders.length < ride.maxRiders) {
            const joinedRide = await rideModel.find({
                riders: { $elemMatch: { rider: userId } },
                $or: [
                    { startDate: { $lte: ride.endDate }, endDate: { $gte: ride.startDate } },
                    { startDate: { $gte: ride.startDate, $lte: ride.endDate } },
                ],
            })
            if (joinedRide.length > 0) {
                res.status(400).json({ errMsg: 'You have joined another ride between that date' })
            } else {
                await rideModel.updateOne({ _id: rideId }, { $push: { riders: { rider: userId, isSure } } })
                if (isSure) {
                    if (role == 'admin') {
                        await clubModel.updateOne({ _id: clubId, 'admins.admin': userId }, { $inc: { 'admins.$.rideCount': 1 } })
                    } else {
                        await clubModel.updateOne({ _id: clubId, 'members.member': userId }, { $inc: { 'members.$.rideCount': 1 } })
                    }
                }

                res.status(200).json({ message: 'Joined successfylly' })
            }
        } else {
            res.status(429).json({ message: 'Max members reached' })
        }


    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}

/////////////////////CONFIRM RIDE///////////////

const confirmRide = async (req, res) => {
    try {
        const { rideId, userId } = req.body
        const { clubId, role } = req.payload

        await rideModel.updateOne({ _id: rideId, 'riders.rider': userId }, { $set: { 'riders.$.isSure': true } })
        if (role == 'admin') {
            await clubModel.updateOne({ _id: clubId, 'admins.admin': userId }, { $inc: { 'admins.$.rideCount': 1 } })
        } else {
            await clubModel.updateOne({ _id: clubId, 'members.member': userId }, { $inc: { 'members.$.rideCount': 1 } })
        }

        res.status(200).json({ message: "Confirmation Success" })
    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}



//////////////GET IMAGES/////////////

const getImages = async (req, res) => {
    try {
        const { clubId } = req.payload
        const club = await clubModel.findOne({ _id: clubId })
        const images = club.rideImages
        res.status(200).json({ images })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


/////////////REMOVE RIDER/////////////////


const removeRider = async (req, res) => {
    try {
        const { rideId, userId } = req.body
        const { clubId } = req.payload
        const isAdmin = await clubModel.findOne({ _id: clubId, 'admins.admin': userId })
        const chat = await chatModel.find({
            users: { $all: [userId] },
            'conditions.ride': rideId
        })
        if (chat.length > 0) {
            await messageModel.deleteMany({ chatId: chat._id })
            await chatModel.deleteMany({
                users: { $all: [userId] },
                'conditions.ride': rideId
            })
        }
        await rideModel.updateOne({ _id: rideId }, { $pull: { riders: { rider: userId } } })
        if (isAdmin) {
            await clubModel.updateOne({ _id: clubId, 'admins.admin': userId }, { $inc: { 'admins.$.rideCount': -1 } })
        } else {
            await clubModel.updateOne({ _id: clubId, 'members.member': userId }, { $inc: { 'members.$.rideCount': -1 } })
        }
        res.status(200).json({ message: 'Removed successfully' })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


/////////////LEFT RIDE///////////////

const leftRide = async (req, res) => {
    try {
        const { rideId, userId } = req.body
        const { clubId, role } = req.payload

        const chat = await chatModel.find({
            users: { $all: [userId] },
            'conditions.ride': rideId
        })
        if (chat.length > 0) {
            await messageModel.deleteMany({ chatId: chat._id })
            await chatModel.deleteMany({
                users: { $all: [userId] },
                'conditions.ride': rideId
            })
        }
        await rideModel.updateOne({ _id: rideId }, { $pull: { riders: { rider: userId } } })
        if (role == 'admin') {
            await clubModel.updateOne({ _id: clubId, 'admins.admin': userId }, { $inc: { 'admins.$.rideCount': -1 } })
        } else {
            await clubModel.updateOne({ _id: clubId, 'members.member': userId }, { $inc: { 'members.$.rideCount': -1 } })
        }
        res.status(200).json({ message: 'left successfully' })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


//////////////////////GET RIDERS///////////////////

const getRiders = async (req, res) => {
    try {
        const { clubId } = req.payload
        const club = await clubModel.findOne({ _id: clubId }).populate('members.member').populate('admins.admin')
        const riders = club.members
        const admin = club.admins[0]
        res.status(200).json({ riders, admin })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

module.exports = {
    loadClubHome,
    exitClub,
    createRide,
    getRides,
    loadSingleRide,
    joinRide,
    getImages,
    removeRider,
    rideHistory,
    leftRide,
    getRiders,
    confirmRide
}