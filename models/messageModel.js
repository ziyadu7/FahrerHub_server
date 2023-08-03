const mongoose = require('mongoose')

const messageSchema = mongoose.Schema({
    message:{
        type:String,
        trim:true,
        required:true
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    chatId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Chat'
    }
},
{
    timestamps:true
})

module.exports = mongoose.model('messages',messageSchema)