const mongoose = require('mongoose')

const chatSchema = mongoose.Schema({
    conditions:[
        {
            club:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Club'
            },
            ride:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Rides'
            },
        }
    ],
    users:[
        {
            type: mongoose.Types.ObjectId,
            ref:"User"
        }
    ],
    latestMessage:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"messages"
    }
},
{
    timestamps:true
})

module.exports = mongoose.model('Chat',chatSchema)