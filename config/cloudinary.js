const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();

let cloud_name = process.env.CLOUDNAME
let api_key = process.env.CLOUD_API
let api_secret = process.env.CLOUD_SECRET

cloudinary.config({ 
    cloud_name, 
    api_key, 
    api_secret 
});

module.exports = cloudinary