const mongoose = require('mongoose')

const questionSchema = mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    questionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    answers: [{
        answer: {
            type: String
        },
        answerBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        likes: {
            type: Array
        },
        likeCount:{
            type:Number,
            default:0
        }
    }]
})

module.exports = mongoose.model('questions',questionSchema)