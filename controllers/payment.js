
const Stripe = require('stripe')
const rentModel = require('../models/rentModel')
require('dotenv').config()

const stripe = Stripe(process.env.STRIPE_KEY)

const createCheckoute = async (req, res) => {
  try {

    const bike = req.body.bike
    const fromDate = req.body.fromDate
    const toDate = req.body.toDate

    const diff = new Date(toDate) - new Date(fromDate)

    const diifference = diff / (1000 * 3600 * 24)
    const amount = bike.rentAmount * diifference

    const existingBooking = await rentModel.findOne({
      bike: bike._id,
      $or: [
        {
          fromDate: { $lte: fromDate },
          toDate: { $gte: fromDate }
        },
        {
          fromDate: { $lte: toDate },
          toDate: { $gte: toDate }
        }
      ]
    });

    if (existingBooking) {
      res.status(409).json({ errMsg: 'This date is already booked.' });
      return;
    } else {
      const user = await stripe.customers.create({
        metadata: {
          userId: req.payload.id,
          bikeId: bike._id,
          fromDate: fromDate,
          toDate: toDate,
          amount: amount
        }
      })

      const session = await stripe.checkout.sessions.create({
        customer: user.id,
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: bike.make + bike.model,
                metadata: {
                  id: bike._id
                }
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.BACKENDURL}/user/paymentSuccess?userId=${req.payload.id}&bikeId=${bike._id}&amount=${amount}&fromDate=${fromDate}&toDate=${toDate}`,
        cancel_url: `${process.env.BACKENDURL}/paymentFail`,
      })

      res.send({ url: session.url });
    }
  } catch (error) {
    res.status(500).json({ errMsg: "Server Error" })
    console.log(error)
  }
}

module.exports = {
  createCheckoute,
}