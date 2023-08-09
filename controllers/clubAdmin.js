const clubModel = require('../models/clubModel');
const rideModel = require('../models/rideModel');
const userModel = require('../models/userModel')
const nodemailer = require('nodemailer')
require('dotenv').config()


/////////////////SEND BLOCK MAIL//////////////
function rideBlockMail(reason, name, email, adminName) {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'trendsetterfas@gmail.com',
                pass: process.env.EMAILPASS
            },
        });
        const mailOption = {
            from: 'trendsetterfas@gmail.com',
            to: email,
            subject: 'ride block mail',
            html: `
            <html>
            <body>
              <p>Dear ${name},</p>
              <p>${reason}</h4>
              <p>${adminName}<br>
              Fahrer Hub Co.</p>
            </body>
          </html>`
        }

        transporter.sendMail(mailOption, (error, info) => {
            if (error) {
                console.log(error.message);
                console.log('Email could not be sent')
            } else {
                res.status(200).json({ message: "Email Send" })
                console.log('Email has been sent:', info.response)
            }
        })
    } catch (error) {
        console.log(error);
        console.log('Error occurred while sending email');
    }
}

/////////////GET CLUB///////////////

const getClub = async (req, res) => {
    try {
        const clubId = req.payload.clubId
        const club = await clubModel.findOne({ _id: clubId })
        res.status(200).json({ club })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

///////GET CLUB MEMBERS////////////

const getMembers = async (req, res) => {
    try {
        const clubId = req.payload.clubId

        const club = await clubModel.findOne({ _id: clubId }).populate('members.member')
        const members = club.members
        res.status(200).json({ members })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

/////////////REMOVE CLUB MEMBER///////////////////

const removeMember = async (req, res) => {
    try {
        const id = req.body.id
        const clubId = req.payload.clubId
        const currentDate = new Date()
        const ride = await rideModel.find({ $and: [{ club: clubId }, { 'riders.rider': id }, { endDate: { $gte: currentDate } }] })
        if (ride.length > 0) {
            res.status(409).json({ errMsg: 'Member included in a ride!' })
        } else {
            await clubModel.updateOne({ _id: clubId }, { $pull: { members: { member: id } } })
            res.status(200).json({ message: 'Member removed successfylly' })
        }

    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


//////////////////EDIT CLUB//////////////////


const editClub = async (req, res) => {
    try {
        const { clubName, city, startedYear, logo } = req.body
        const { clubId } = req.payload
        await clubModel.updateOne({ _id: clubId }, { $set: { clubName, city, startedYear, logo } })
        res.status(200).json({ message: "Club updated successfully" })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


///////////////////GET IMAGES//////////

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

///////////////ADD IMAGE/////////////

const addImage = async (req, res) => {
    try {
        const { image } = req.body
        const { clubId } = req.payload

        await clubModel.updateOne({ _id: clubId }, { $push: { rideImages: { image } } })

        res.status(200).json({ message: "Image added successfully" })

    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


//////////////REMOVE IMAGE/////////////

const removeImage = async (req, res) => {
    try {
        const { imageId } = req.body
        const { clubId } = req.payload

        await clubModel.updateOne({ _id: clubId }, { $pull: { rideImages: { _id: imageId } } })
        res.status(200).json({ message: "image removed successfully" })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


//////////////////BLOCK RIDE//////////////

const blockRide = async (req, res) => {
    try {
        const { reason, email, name, rideId } = req.body
        const { userId } = req.payload
        const admin = await userModel.findOne({ _id: userId })
        rideBlockMail(reason, name, email, admin.name)
        await rideModel.updateOne({ _id: rideId }, { $set: { isBlocked: true } })
        res.status(200).json({ message: "Ride blocked successfully" })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


//////////////////UNBLOCK RIDE///////////////////

const unBlockRide = async (req, res) => {
    try {
        const { rideId } = req.body
        await rideModel.updateOne({ _id: rideId }, { $set: { isBlocked: false } })
        res.status(200).json({ message: "Ride unblocked successfully" })

    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


/////////////////CANCEL RIDE///////////////


const cancelRide = async (req, res) => {
    try {
        const { rideId } = req.body
        await rideModel.deleteOne({ _id: rideId })
        res.status(200).json({ message: 'Ride removed successfully' })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


//////////////ALLOW RIDE///////////////


const allowRide = async (req, res) => {
    try {
        const { rideId } = req.body
        await rideModel.updateOne({ _id: rideId }, { $set: { isAccepted: true } })
        res.status(200).json({ message: "Ride allowed successfully" })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

////////////REQUEST MANAGE///////////////

const requestManage = async (req, res) => {
    try {
        const { userId, accepted } = req.body
        const { clubId } = req.payload
        if (accepted) {
            await clubModel.updateOne({ _id: clubId, 'members.member': userId }, { $set: { 'members.$.isAccepted': true } })
        } else {
            await clubModel.updateOne({ _id: clubId }, { $pull: { members: { member: userId } } })
        }
        res.status(200).json({ message: "Status changed successfully" })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

module.exports = {
    getClub,
    getMembers,
    removeMember,
    editClub,
    getImages,
    addImage,
    removeImage,
    blockRide,
    unBlockRide,
    cancelRide,
    allowRide,
    requestManage
}