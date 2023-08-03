const mongoose = require('mongoose')

const rentSchema = mongoose.Schema({
    fromDate:{
        type:Date,
        required:true
    },
    toDate:{
        type:Date,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    amount:{
        type:Number
    },
    bike:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'bikes',
        required:true
    },
    returned:{
        type:Boolean,
        default:false
    },
    bookedAt:{
        type:Date
    }
})

module.exports = mongoose.model('rent',rentSchema)