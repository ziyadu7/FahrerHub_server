const mongoose = require('mongoose')
const bikeSchema = mongoose.Schema({
    model: {
        type: String,
        required: true
    },
    make: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    rentAmount: {
        type: Number,
        required: true
    },
    cc: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: {
        type: Array
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        review: {
            type: String
        }
    }
    ],
    isBooked: {
        type: Boolean,
        default: false
    },
    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'locations'
    }
})

module.exports = mongoose.model('bikes', bikeSchema)