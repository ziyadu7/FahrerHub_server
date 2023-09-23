const userModel = require('../models/userModel')
const bikeModel = require('../models/bikeModel')
const clubModel = require('../models/clubModel')
const nodemailer = require('nodemailer')
const sha256 = require('js-sha256')
const { default: mongoose } = require('mongoose')
const { ObjectId } = mongoose.Types;
const { generateToken } = require('../middlewares/auth')
const rentModel = require('../models/rentModel')
const rideModel = require('../models/rideModel')
const questionModel = require('../models/questionModel')
const locationModel = require('../models/locationModel')
require('dotenv').config()



///////////////SEND VERIFY MAIL/////////////


const sendVerifyMail = async (name, email, userId) => {
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
            subject: 'Email verification',
            html: `<p>Hii ${name}, please click <a href="${process.env.FRONTENDURL}/emailVerify/${userId}">here</a> to verify your email.</p>`,
        };

        transporter.sendMail(mailOption, (error, info) => {
            if (error) {
                console.log(error.message);
                console.log('Email could not be sent')
            } else {
                console.log('Email has been sent:', info.response)
            }
        });
    } catch (error) {
        console.log(error);
        console.log('Error occurred while sending email');
    }
};


////////////SEND FORGOTT PASSWORD MAIL//////////////

const sendForgottPasswordMail = async (email,name,userId) => {
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
            subject: 'Forgott password',
            html: `<p>Hii ${name} please click <a href="${process.env.FRONTENDURL}/resetPassword/${userId}">here</a> if you wan't to reset password your email.</p>`,
        };

        transporter.sendMail(mailOption, (error, info) => {
            if (error) {
                console.log('Email could not be sent',error.message)
                return false
            } else {
                console.log('Email has been sent:', info.response)
                return true
            }
        })
    } catch (error) {
        console.log(error)
        console.log('Error occurred while sending email');
        return false
    }
};


/////////////////VERIFY MAIL///////////////

const verifyMail = async (req, res, next) => {
    try {
        const { userId } = req.params
        await userModel.updateOne({ _id: userId }, { $set: { isVerified: true } })
        res.status(200).json({ message: "Email verifed successfully" })
    } catch (error) {
        next(error.message)
    }
}

///////////////USER REGISTER //////////////

const register = async (req, res) => {
    try {
        let { name, email, password, phone, city } = req.body
        email = email.trim()
        password = password.trim()
        const user = await userModel.findOne({ $or:[{email},{phone}] })
        if (user && !user.password) {
            return res.status(409).json({ errMsg: "User already exist, try Google Login" })
        } else if (user) {
            return res.status(409).json({ errMsg: "User already exist" })
        } else {
            const newUser = await userModel.create({
                name, email, phone, city, password: sha256(password + process.env.SALT)
            })
            sendVerifyMail(name, email, newUser._id)
            res.status(200).json({ message: 'User registered successfully Please verify your mail' })
        }
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }

}


//////////USER LOGIN////////////

const login = async (req, res) => {
    try {
        let { email, password, reMail } = req.body
        const user = await userModel.findOne({ $and: [{ email }, { password: sha256(password + process.env.SALT) }] })
        if (!user) {
            res.status(400).json({ errMsg: "Email and password not match" })
        } else if (user.isBlocked) {
            res.status(403).json({ errMsg: 'User is blocked by admin' })
        } else if (user && reMail) {
            sendVerifyMail(user.name, user.email, user._id)
        } else if (!user.isVerified) {
            res.status(401).json({ errMsg: "Email is not verified" })
        } else {
            const token = generateToken(user._id, 'user')
            res.status(200).json({ message: 'user login successfully', name: user.name, token, userId: user._id, role: 'user' })
        }

    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


///////////OTP LOGIN/////////////

const otpLogin = async (req,res)=>{
    try {
        const {phone} = req.body
        const user = await userModel.findOne({phone})
        if(user){
            const token = generateToken(user._id, 'user')
            const data={
                token,
                name:user.name,
                userId:user._id,
                role:'user'
            }
            res.status(200).json({data})
        }else{
            res.status(404).json({errMsg:"User not found"})
        }
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" }) 
    }
}

////////////////////FORGOTT PASSWORD///////////////

const forgottPassword = async (req,res)=>{
    try {
        const {email} = req.body
        const user = await userModel.findOne({email})
        if(user){
            const response = sendForgottPasswordMail(email,user.name,user._id)
            if(response){
                res.status(200).json({errMsg:'Please check your mail'})
            }else{
                res.status(550).json({errMsg:"Error occured while sending mail"})
            }
        }else{
            res.status(400).json({errMsg:'User not found'})
        }
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


//////////////RESET PASSWORD///////////////////

const resetPassword = async (req,res)=>{
    try {
        const {userId,password} = req.body
        await userModel.updateOne({_id:userId},{$set:{password: sha256(password + process.env.SALT)}})
        res.status(200).json({message:"Password changed"})
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
        
    }
}


/////////////////////GOOGLE LOGIN////////////////////

const googleLogin = async (req, res) => {
    try {
        let { profile } = req.body
        const email = profile?.email
        const name = profile?.name
        const profileImage = profile?.picture
        const user = await userModel.findOne({ email: email })
        if (!user) {
            const newUser = await userModel.create({ email, name, profileImage, isVerified: true })
            const token = generateToken(newUser._id, 'user')
            res.status(200).json({ message: "User created successfully", name: newUser.name, token, userId: newUser._id, role: 'user' })
        } else if (user.isBlocked) {
            res.status(403).json({ errMsg: 'User is blocked by admin' })
        } else {
            if (!user.isVerified) {
                if (!user.profileImage) {
                    await userModel.updateOne({ email }, { $set: { profileImage, isVerified: true } })
                } else {
                    await userModel.updateOne({ _id: user._id }, { $set: { isVerified: true } })
                }
                const token = generateToken(user._id, 'user')
                res.status(200).json({ message: 'user login successfully', name: user.name, token, userId: user._id, role: 'user' })
            } else {
                if (!user.profileImage) {
                    await userModel.updateOne({ email }, { $set: { profileImage } })
                }
                const token = generateToken(user._id, 'user')
                res.status(200).json({ message: 'user login successfully', name: user.name, token, userId: user._id, role: 'user' })
            }
        }
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


////////////////////SHOW BIKES ///////////////

const getBikes = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 0;
        const location = req.query.location;
        const search = req.query.search||'';

        let bikes = [];
        let noMore = false;
        let locations = [];
      
        if (limit === 10) {
          locations = await locationModel.find({});
        }
      
        if (location!=0) {
          bikes = await bikeModel
            .find({
              $and: [
                { isBooked: false },
                { locationId: new ObjectId(location) },
                {
                  $or: [
                    { category: { $regex: search, $options: 'i' } },
                    { make: { $regex: search, $options: 'i' } },
                    { model: { $regex: search, $options: 'i' } },
                  ],
                },
              ],
            })
            .limit(limit)
            .populate('locationId');
      
          if (bikes.length%10!=0) noMore = true;
      
          res.status(200).json({ bikes, locations, noMore });
        } else {
          if (limit % 10 === 0||search.trim().length>0) {
              bikes = await bikeModel
              .find({
                  $and: [
                      { isBooked: false },
                      {
                          $or: [
                              { category: { $regex: search, $options: 'i' } },
                              { make: { $regex: search, $options: 'i' } },
                              { model: { $regex: search, $options: 'i' } },
                            ],
                        },
                    ],
                })
                .limit(limit)
                .populate('locationId');
                console.log(search,bikes.length,'====');
      
            if (bikes.length%10!=0) noMore = true;
          } else {
            noMore = true;
          }
      
          res.status(200).json({ bikes, locations, noMore });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ errMsg: "Server Error" });
      }
      
}


/////////////////GET SINGLE BIKE DETAILS//////////////

const getSingleBike = async (req, res) => {
    try {
        const bikeId = req.params.bikeId
        const userId = req.payload.id
        const currentDate = new Date()
        currentDate.setDate(currentDate.getDate() + 1)
        const wallet = await userModel.findOne({ _id: userId }).select('wallet')
        const isReview = await rentModel.findOne({ $and: [{ bike: bikeId }, { user: userId }, { toDate: { $lte: new Date() } }] })
        const isBooked = await rentModel.findOne({ $and: [{ bike: bikeId }, { user: userId }, { toDate: { $gte: new Date() } }] })
        const bike = await bikeModel.findOne({ _id: bikeId }).populate('reviews.user').populate('locationId')
        const currentUser = await rentModel.findOne({ $and: [{ bike: bikeId }, { fromDate: { $lte: currentDate } }, { toDate: { $gte: new Date() } }] }).populate('user')
        res.status(200).json({ isReview, bike, currentUser, isBooked ,wallet})
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}



////////////////GET PROFILE DETAILS////////////

const loadProfile = async (req, res) => {
    try {
        const id = req.payload.id
        const user = await userModel.findOne({ _id: id })
        const rentBikes = await rentModel.find({ user: id }).populate('bike')
        const adminClubs = await clubModel.find({ 'admins.admin': id })
        const memberClubs = await clubModel.find({ 'members.member': id })
        const rides = await rideModel.find({ 'riders.rider': id })
        res.status(200).json({ user, adminClubs, memberClubs, rentBikes, rides })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}



/////////////////////EDIT PROFILE ////////////////

const editProfile = async (req, res) => {
    try {
        let { name, profileImage, mobile } = req.body
        console.log('edit profile');
        name = name.trim()
        let user = null
        if(mobile){
             user = await userModel.findOne({phone:mobile})
        }
        if(user){
            res.status(404).json({errMsg:"Mobile number already exist"})
        }else{
            if(mobile){
                await userModel.updateOne({ _id: req.payload.id }, { $set: { name, profileImage, phone:mobile } })
            }else{
            await userModel.updateOne({ _id: req.payload.id }, { $set: { name, profileImage} })
            }
            res.status(200).json({ message: "Profile updated successfully" })
        }
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


/////////////////CREATE CLUB//////////////

const createClub = async (req, res) => {
    try {
        const { clubName, city, logo, year, isPrivate } = req.body
        const id = req.payload.id
        await clubModel.create({ clubName, city, logo, startedYear: year, admins: [{ admin: id }], isProtected: isPrivate })
        res.status(200).json({ message: 'Club Created Successfully' })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


///////////GET CLUBS//////////////

const getClubs = async (req, res) => {
    try {
        const userId = req.payload.id
        const clubs = await clubModel.find({
            isProtected: false,
            isBlocked:false,
            $and: [
                { 'members.member': { $ne: userId } },
                { 'admins.admin': { $ne: userId } }
            ]
        }).populate('admins.admin');

        const protClubs = await clubModel.find({
            isProtected: true,
            isBlocked:false,
            $and: [
                { 'members.member': { $ne: userId } },
                { 'admins.admin': { $ne: userId } }
            ]
        }).populate('admins.admin');
        res.status(200).json({ clubs, protClubs })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

///////////////REMOVE REQUEST//////////

const removeRequest = async (req, res) => {
    try {
        const { clubId } = req.body
        const { id } = req.payload

        await clubModel.updateOne({ _id: clubId }, { $pull: { members: { member: id } } })

        res.status(200).json({ message: 'Request removed' })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

///////////GET YOUR CLUBS//////////////

const getYourClubs = async (req, res) => {
    try {
        const userId = req.payload.id
        const clubs = await clubModel.find({
            isBlocked:false,
            $or: [
                { 'members': { $elemMatch: { member: userId, isAccepted: true } } },
                { 'admins.admin': userId }
            ]
        }).populate('admins.admin');

        const reqClubs = await clubModel.find({
            isBlocked:false,
            $or: [
                { 'members': { $elemMatch: { member: userId, isAccepted: false } } },
                { 'admins.admin': userId }
            ]
        }).populate('admins.admin');

        res.status(200).json({ clubs, reqClubs })
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}


//////////////JOIN CLUB///////////////


const joinClub = async (req, res) => {
    try {
        const clubId = req.body.id
        const userId = req.payload.id

        const club = await clubModel.findOne({ _id: clubId })
        if (club.isProtected) {
            await clubModel.updateOne({ _id: clubId }, { $push: { members: { member: userId, isAccepted: false } } })
            res.status(200).json({ message: "Join request sent" })
        } else {
            await clubModel.updateOne({ _id: clubId }, { $push: { members: { member: userId } } })
            res.status(200).json({ message: "Joined successfully" })
        }
    } catch (error) {
        res.status(500).json({ errMsg: "Server Error" })
    }
}

//////////////ADD REVIEW/////////////////

const addReview = async (req, res) => {
    try {
        const review = req.body.review
        const bikeId = req.body.bikeId
        const userId = req.payload.id

        const exist = await bikeModel.findOne({ _id: bikeId, "reviews.user": userId })
        if (exist) {
            res.status(409).json({ errMsg: "You already added review" })
        } else {
            await bikeModel.updateOne({ _id: bikeId }, { $push: { reviews: { user: userId, review } } })
            res.status(200).json({ message: "Review added successfully" })
        }

    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}


//////////////RETURN BIKE/////////////////

const returnBike = async (req, res) => {
    try {
        const { rentId, bikeId } = req.body
        await rentModel.updateOne({ _id: rentId }, { $set: { returned: true } })
        await bikeModel.updateOne({ _id: bikeId }, { $set: { isBooked: false } })
        res.status(200).json({ message: 'Status changed successfully' })
    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}


///////////////////CANCEL BOOKKING/////////////////

const cancelBooking = async (req,res)=>{
    try {
        const { rentId, bikeId } = req.body
        const {id} = req.payload
        const rent = await rentModel.findOne({ _id: rentId })
        await userModel.updateOne(
            { _id: id },
            {
              $inc: { wallet: rent.amount }
            }
          )
                           
        await rentModel.deleteOne({ _id: rentId })
        await bikeModel.updateOne({ _id: bikeId }, { $set: { isBooked: false } })
        res.status(200).json({ message: 'Booking cancelled successfully' })
    } catch (error) {
        console.log(error);
        res.status(500).json({ errMsg: 'Server Error' })
    }
}

/////////////PAYMENT SUCCESS//////////////

const paymentSuccess = async (req, res) => {
    try {
        const { bikeId, fromDate, toDate, amount, userId } = req.query
        const load = true
        await rentModel.create({
            user: userId,
            bike: bikeId,
            fromDate: fromDate,
            toDate: toDate,
            amount: amount,
            bookedAt: new Date()
        })

        await bikeModel.updateOne({ _id: bikeId }, { $set: { isBooked: true } })

        res.redirect(`${process.env.FRONTENDURL}/paymentSuccess/${load}`)
    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}

/////////////PAYMENT FAIL///////////////

const paymentFail = async (req, res) => {
    try {
        res.redirect(`${process.env.FRONTENDURL}/paymentFail`)
    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}

////////////////ADD QUESTIONS/////////////

const addQuestion = async (req, res) => {
    try {
        const { question } = req.body
        const { id } = req.payload

        await questionModel.create({ question, questionBy: id })

        res.status(200).json({ message: 'Question added successfully' })
    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}


/////////////GET QUESTIONS/////////////////

const getQuestions = async (req, res) => {
    try {
        const questions = await questionModel.find({}).populate('questionBy').populate('answers.answerBy')
        res.status(200).json({ questions })
    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}


//////////////ADD ANSWER////////////////

const addAnswer = async (req, res) => {
    try {
        const { answer, questionId } = req.body
        const { id } = req.payload
        const alredyAnswered = await questionModel.findOne({ _id: questionId, 'answers.answerBy': id })
        if (alredyAnswered) {
            res.status(409).json({ errMsg: 'You already answered once' })
        } else {
            await questionModel.updateOne({ _id: questionId }, { $push: { answers: { answer, answerBy: id } } })
            const answers = await questionModel.findOne({ _id: questionId }).populate('questionBy').populate('answers.answerBy')
            res.status(200).json({ message: 'Answer addedd successfully', answers: answers.answers })
        }

    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}


//////////////ADD LIKE//////////////

const addLike = async (req, res) => {
    try {
        const { id } = req.payload

        const { answerId, questionId } = req.body

        await questionModel.updateOne(
            { _id: questionId, 'answers._id': answerId, 'answers.likes': { $ne: id } },
            {
                $push: { 'answers.$.likes': id },
                $inc: { 'answers.$.likeCount': 1 },
            }
        );

        res.status(200).json({ message: 'liked successfully' })

    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}



//////////////DISLIKE/////////////////////


const disLike = async (req, res) => {
    try {
        const { id } = req.payload
        const { answerId, questionId } = req.body

        await questionModel.updateOne(
            { _id: questionId, 'answers._id': answerId, 'answers.likes': { $eq: id } },
            {
                $pull: { 'answers.$.likes': id },
                $inc: { 'answers.$.likeCount': -1 },
            }
        );

        res.status(200).json({ message: 'diLiked successfully' })
    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}

//////////////////ADD BIKE////////////////

const addBike = async (req, res) => {
    try {
        const { make, model, category, cc, image } = req.body
        const { id } = req.payload

        await userModel.updateOne({ _id: id }, { $set: { 'bike.model': model, 'bike.make': make, 'bike.category': category, 'bike.cc': cc, 'bike.image': image } })

        res.status(200).json({ message: 'Bike added successfully' })
    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}


////////////////////EDIT BIKE////////////////////

const editBike = async (req, res) => {
    try {
        const { make, model, category, cc, image } = req.body
        const { id } = req.payload

        await userModel.updateOne({ _id: id }, { $set: { 'bike.model': model, 'bike.make': make, 'bike.category': category, 'bike.cc': cc, 'bike.image': image } })

        res.status(200).json({ message: 'Bike edited successfully' })
    } catch (error) {
        res.status(500).json({ errMsg: 'Server Error' })
    }
}


module.exports = {
    register,
    login,
    getBikes,
    loadProfile,
    editProfile,
    createClub,
    getClubs,
    joinClub,
    getYourClubs,
    getSingleBike,
    addReview,
    returnBike,
    verifyMail,
    paymentSuccess,
    paymentFail,
    addQuestion,
    getQuestions,
    addAnswer,
    addLike,
    disLike,
    addBike,
    editBike,
    removeRequest,
    googleLogin,
    forgottPassword,
    resetPassword,
    otpLogin,
    cancelBooking
}