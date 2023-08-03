const mongoose = require('mongoose')

const locationSchema = mongoose.Schema({
    location:{
        type:String,
    }
})

module.exports = mongoose.model('locations',locationSchema)