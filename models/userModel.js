const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    phone:{
        type:Number
    },
    password:{
        type:String
    },
    profileImage:{
        type:String,
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    bike:{
        make:{
            type:String
        },
        model:{
            type:String
        },
        cc:{
            type:Number
        },
        category:{
            type:String
        },
        image:{
            type:String
        }
    }
})

module.exports = mongoose.model('User',userSchema)