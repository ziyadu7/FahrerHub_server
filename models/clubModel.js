const mongoose = require('mongoose')
const clubSchema = mongoose.Schema({
    clubName: {
        type: String,
        required: true
    },
    admins: [{
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rideCount:{
            type:Number,
            default:0
        }
    }],
    members: [
        {
            member: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            isAccepted: {
                type: Boolean,
                default: true
            },
            rideCount:{
                type:Number,
                default:0
            }
        }
    ],
    city: {
        type: String,
        required: true
    },
    logo: {
        type: String,
    },
    rideImages: [{
        image: {
            type: String
        }
    }],
    rides: [{
        ride: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'rides'
        }
    }],
    startedYear: {
        type: Date
    },
    isProtected: {
        type: Boolean,
        default: false
    },
    isBlocked:{
        type:Boolean,
        default:false
    }
})

module.exports = mongoose.model('Club', clubSchema)