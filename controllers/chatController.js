const chatModel = require('../models/chatModel')
const rideModel = require('../models/rideModel')
const userModel = require('../models/userModel')
const messageModel = require('../models/messageModel')

const accessChat = async (req, res) => {
    try {
        const { userId, clubId } = req.payload
        const { receiverId, rideId } = req.body
        const chat = await chatModel.findOne({
            $and: [
                { users: { $in: [userId] } },
                { 'conditions.club': clubId },
                { 'conditions.ride': rideId },
                { 'users': receiverId }
            ]
        }).populate('users').populate('conditions.club').populate('conditions.ride').populate('latestMessage').sort({ updatedAt: -1 })
        if (chat) {
            const messages = await messageModel.find({ chatId: chat._id }).populate('sender')
            res.status(200).json({ chat, messages })
        } else {
            const newChat = await chatModel.create({
                users: [userId, receiverId],
                conditions: [{
                    club: clubId,
                    ride: rideId
                }],
                latestMessage: null
            })

            const chat = await chatModel.findOne({ _id: newChat._id }).populate('users').populate('conditions.club').populate('conditions.ride').populate('latestMessage')
            const messages = await messageModel.find({ chatId: chat._id }).populate('sender')
            res.status(200).json({ chat, messages })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ errMsg: error.message })
    }
}


//////////////////GET USERS///////////////////

const getUsers = async (req, res) => {
    try {
        const { rideId } = req.params

        const ride = await rideModel.findOne({ _id: rideId }).populate('head').populate('riders.rider')
        const users = ride.riders
        const head = ride.head

        res.status(200).json({ head, users })

    } catch (error) {
        console.log(error)
        res.status(500).json({ errMsg: error.message })
    }
}



///////////////////ADD MESSAGE/////////////

const addMessage = async (req, res) => {
    try {
        const { message, chatId } = req.body
        const { userId } = req.payload
        const msg = await messageModel.create({ message, chatId, sender: userId })
        await chatModel.updateOne({ _id: chatId }, { $set: { latestMessage: msg._id } })
        res.status(200).json({ msg,chatId })
    } catch (error) {
        console.log(error)
        res.status(500).json({ errMsg: error.message })
    }
}

module.exports = {
    accessChat,
    getUsers,
    addMessage
}