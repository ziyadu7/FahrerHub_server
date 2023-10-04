const cron = require('node-cron');
const mongoose = require('mongoose');
const rentModel = require('../models/rentModel');
const superAdminController = require('../controllers/superAdmin')
require('dotenv').config()

mongoose.connect(process.env.MONGOCONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const rentMailSendCron = async () => {
    try {
        console.log('===cron working===');
        const currentDate = new Date();

        const rents = await rentModel.find({$and:[{toDate:{$lt: currentDate }},{returned:false}]}).populate('user').populate('bike')

        for(let i=0;i<rents.length;i++){
            superAdminController.rentMailSend(rents[i].user.name,rents[i].user.email,rents[i].bike,rents[i],'Ziyad')
        }

    } catch (error) {
        console.error('Error while sending the mail on cron:', error);
    }
};

cron.schedule('0 1 * * *', () => {
    rentMailSendCron();
});