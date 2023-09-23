const superAdminModel = require('../models/adminModel')
const bikeModel = require('../models/bikeModel')
const clubModel = require('../models/clubModel')
const { generateToken } = require('../middlewares/auth')
const rentModel = require('../models/rentModel')
const nodemailer = require('nodemailer')
const locationModel = require('../models/locationModel')
const rideModel = require('../models/rideModel')
const userModel = require('../models/userModel')
const mime = require("mime-types")
const cloudinary = require('../config/cloudinary')
const fs = require("fs");

/////////////////RENT MAIL SENDING/////

function rentMailSend(name, email, bike, rent, adminName) {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'trendsetterfas@gmail.com',
                pass: process.env.EMAILPASS
            },
        });
        const mailOption = {
            from: 'trendsetterfas@gmail.com',
            to: email,
            subject: 'Rent Bike return request',
            html: `
            <html>
            <body>
              <p>Dear ${name},</p>
              <p>We hope this email finds you well. We are writing to remind you about the return of the rented bike from ASD Rents Co. It appears that the rental period for the bike you currently have is nearing its end.</p>
              <p> We kindly request that you return the bike to our rental facility at your earliest convenience. Returning the bike on time ensures that it remains available for other customers and helps us maintain an efficient rental service.</p>
              <h3>Please take note of the following details:</h3>
              <h4>Rental Information:</h4>
              <p>Bike Model: ${bike.model}</p>
              <p>Rental Start Date: ${rent.fromDate}</p>
              <p>Rental End Date: ${rent.toDate}</p>
              <h4>Return Address:</h4>
              <p>ASD Rents Co.</p>
              <p>kinfra</p>
              <p>Calicut</p>
              <p>Calicut,kerala,india</p>

              <h2> Return Instructions:</h2>

              <p>Ensure that the bike is in good condition, free from any damage or excessive wear and tear.
              Gather any rented accessories or additional items that were provided with the bike.
              Pack the bike securely for transportation, considering the safety of the bike and others during transit.
              Visit our rental facility during our business hours to return the bike.
              Our staff will assist you with the return process, including the completion of any necessary paperwork.
              Please be aware that failing to return the bike by the specified return date may result in additional rental charges and the loss of future rental privileges. We kindly ask for your prompt attention to avoid any inconvenience.
              
              If you have any questions or need further assistance, please feel free to contact our customer support team at [Phone Number] or via email at [Email Address]. We will be more than happy to assist you.
              
              Thank you for choosing ASD Rents Co. for your biking needs. We appreciate your cooperation and look forward to receiving the rented bike back soon.
              
              Best regards,</p>
              <p>${adminName}
              Fahrer Hub Co.</p>
            </body>
          </html>`
        }

        transporter.sendMail(mailOption, (error, info) => {
            if (error) {
                console.log(error.message);
                console.log('Email could not be sent')
            } else {
                console.log('Email has been sent:', info.response)
            }
        })
    } catch (error) {
        console.log(error);
        console.log('Error occurred while sending email');
    }
}

//////////////ADMIN LOGIN///////////

const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const admin = await superAdminModel.findOne({ $and: [{ email }, { password }] })
        if (admin) {
            const token = generateToken(admin._id, 'superAdmin')
            res.status(200).json({ message: "Admin login success", name: admin.name, role: 'superAdmin', token })
        } else {
            res.status(409).json({ errMsg: 'You are not an admin' })
        }
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

////////////////ADD BIKES/////////////////

const addBikes = async (req, res) => {
    const { files, body: { make, model, rentAmount, cc, category, description, locationId } } = req
    try {
        let images = [];

        if (files) {
            for await (const file of files) {
                const mimeType = mime.lookup(file.originalname);
                if (mimeType && mimeType.includes("image/")) {
                    const upload = await cloudinary.uploader.upload(file.path);
                    images.push(upload.secure_url);
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                };
            };
        }
        await bikeModel.create({ make, locationId, model, rentAmount, images, cc, category, description })
        res.status(200).json({ message: "Bike added succesfully" })
    } catch (error) {
        if (files) for await (const file of files) if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        res.status(500).json({ errMsg: "Server Error" })
    }
}

////////////SHOW BIKES////////////////

const showBikes = async (req, res) => {
    try {
        const { skip, search ,calls} = req.query

        const bikes = await bikeModel.find({
            $or: [
                { category: { $regex: search, $options: 'i' } },
                { make: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
            ]
        }).skip(skip).limit(10)

        let length

        if(calls==0){
             length = await bikeModel.find({}).count()
             length = Math.ceil(length/10)
        }else if(search.trim()!==''){
            length = Math.ceil(users/10)
        }

        res.status(200).json({ bikes,length })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

//////////////REMOVE BIKE///////////////

const removeBike = async (req, res) => {
    try {
        const id = req.params.id
        const using = rentModel.find({ bike: id }, { $or: [{ toDate: { $gt: new Date() } }, { returned: false }] })
        if (using.length > 0) {
            res.status(409).json({ errMsg: 'The bike currently a user is using' })
        }
        await bikeModel.findOneAndDelete({ _id: id })
        res.status(200).json({ message: "Bike removed successfully" })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

/////////GET EDIT BIKE///////////

const getEditBike = async (req, res) => {
    try {
        const id = req.params.id
        const bike = await bikeModel.findOne({ _id: id }).populate('locationId')
        res.status(200).json({ bike })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


/////////////////EDIT BIKE////////////////

const editBike = async (req, res) => {

    const { files, body: { make, model, rentAmount, cc, category, description, locationId } } = req

    try {
        const id = req.params.id
        let images = [];

        if (files) {
            for await (const file of files) {
                const mimeType = mime.lookup(file.originalname);
                if (mimeType && mimeType.includes("image/")) {
                    const upload = await cloudinary.uploader.upload(file.path);
                    images.push(upload.secure_url);
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                };
            };
        }

        await bikeModel.updateOne({ _id: id }, { $set: { make, model, rentAmount, images, cc, category, description, images, locationId } })
        res.status(200).json({ message: 'Bike details edited successfully' })

    } catch (error) {
        if (files) for await (const file of files) if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

        res.status(500).json({ errMsg: "Server Error" })
    }
}


//////////////////BLOCK CLUB////////////////

const blockClub = async (req, res) => {
    try {
        const { clubId, isBlock } = req.body
        const currentDate = new Date()

        if (isBlock) {

            const ride = await rideModel.find({ club: clubId, endDate: { $gt: currentDate } })

            if (ride.length > 0) {
                res.status(405).json({ errMsg: 'There is already have planned rides' })
            } else {
                await clubModel.updateOne({ _id: clubId }, { $set: { isBlocked: true } })
                res.status(200).json({ message: "Club bolcked successfully" })
            }
        } else {
            await clubModel.updateOne({ _id: clubId }, { $set: { isBlocked: false } })
            res.status(200).json({ message: "Club unbolcked successfully" })
        }

    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })

    }
}


/////////////////////GET CLUBS/////////////



const getClubs = async (req, res) => {
    try {
        const clubs = await clubModel.find({}).populate('admins.admin')
        res.status(200).json({ clubs })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}



////////////////////GET RENTS////////////

const getRents = async (req, res) => {
    try {
        const rents = await rentModel.find({}).populate('user').populate('bike')
        res.status(200).json({ rents })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


//////////////////CHANGE USERS STATUS////////////////

const userStatus = async (req, res) => {
    try {
        const { userId, blocked } = req.body
        const currentDate = new Date()
        if (blocked) {
            await userModel.updateOne({ _id: userId }, { $set: { isBlocked: false } })
            res.status(200).json({ message: 'Status changed successfully' })
        } else {
            const participation = await rideModel.findOne({
                $and: [
                    {
                        $or: [{ 'head': userId }, { 'riders': { $elemMatch: { 'rider': userId } } }],
                    },
                    {
                        $or: [{ startDate: { $gt: currentDate } }, { endDate: { $gt: currentDate } }],
                    },
                ],
            });
            if (participation) {
                res.status(405).json({ errMsg: 'This user is included in a upcoming ride' })
            } else {
                await userModel.updateOne({ _id: userId }, { $set: { isBlocked: true } })
                res.status(200).json({ message: 'Status changed successfully' })
            }
        }

    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

//////////////GET USERS/////////////////

const users = async (req, res) => {
    try {
        const { skip, search,calls } = req.query
   
        const users = await userModel.find({ name: { $regex: search, $options: 'i' } }).skip(skip).limit(10)
    
        let length

        if(calls==0){
             length = await userModel.find({}).count()
             length = Math.ceil(length/10)
        }else if(search.trim()!==''){
            length = Math.ceil(users/10)
        }

        res.status(200).json({ users, length })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


////////////////GET DASHBORD///////////////

const getDashbord = async (req, res) => {
    try {
        const rents = await rentModel.find({}).populate('user').populate('bike')
        const users = await userModel.find({})
        const bikes = await bikeModel.find({})
        const clubs = await clubModel.find({})

        const bikeRentMap = new Map();

        rents.forEach((rent) => {
            const { amount } = rent;
            const bike = rent.bike.model
            const bikeId = rent.bike._id.toString()

            if (bikeRentMap.has(bikeId)) {
                bikeRentMap.get(bikeId).totalRent += amount;
            } else {
                bikeRentMap.set(bikeId, {
                    bikeName: bike,
                    totalRent: amount
                });
            }
        });

        res.status(200).json({ rents, userCount: users.length, clubCount: clubs.length, bikeCount: bikes.length, rentGrap: Array.from(bikeRentMap.values()) })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

//////////////////GET LOCATIONS///////////

const getLocations = async (req, res) => {
    try {
        const locations = await locationModel.find({})
        res.status(200).json({ locations })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

/////////////SEND RENT MAIL/////////////////

const sendRentMail = async (req, res) => {
    try {
        const { name, email, bikeId, rent, adminName } = req.body
        const bike = await bikeModel.findOne({ _id: bikeId })
        rentMailSend(name, email, bike, rent, adminName)
        res.status(200).json({ message: 'mail send successfully' })
    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}


////////////////////REMOVELOCATIONS//////////////

const removeLocation = async (req, res) => {
    try {
        const { locationId } = req.params

        const used = await bikeModel.find({ locationId: locationId })
        if (used.length > 0) {
            res.status(409).json({ errMsg: 'Bikes already exist in this location' })
        } else {
            await locationModel.deleteOne({ _id: locationId })
            res.status(200).json({ message: 'Location removed successfully' })
        }

    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}


/////////////////ADD LOCATION////////////////

const addLocation = async (req, res) => {
    try {
        const { newLocation } = req.body
        await locationModel.create({ location: newLocation })
        res.status(200).json({ message: 'Location added successfully' })
    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}

module.exports = {
    login,
    addBikes,
    showBikes,
    removeBike,
    getEditBike,
    editBike,
    getClubs,
    getRents,
    sendRentMail,
    getLocations,
    removeLocation,
    addLocation,
    blockClub,
    getDashbord,
    userStatus,
    rentMailSend,
    users
}