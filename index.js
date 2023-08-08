require('dotenv').config()
const morgan = require('morgan')
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const {connectDb} = require('./config/dbConnection')
const userRouter = require('./routers/userRouter')
const superAdminRouter = require('./routers/superAdmin')
const clubAdminRouter = require('./routers/clubAdmin')
const clubRouter = require('./routers/club')
const paymentRouter = require('./routers/payment')
const chatRouter = require('./routers/chatRoute')
const jwt = require('jsonwebtoken')

const app = express()

app.use(morgan('dev'))
app.use(cors())
app.use(express.json({limit:'100mb',extended:true}))
app.use(cookieParser())

app.use('/user',userRouter)
app.use('/admin',superAdminRouter)
app.use('/clubAdmin',clubAdminRouter)
app.use('/club',clubRouter)
app.use('/payment',paymentRouter)
app.use('/chat',chatRouter)

connectDb()
const server = app.listen(process.env.PORT,()=>{
    console.log('server started'); 
})


const io = require('socket.io')(server,{
    cors: {
        origin:'*',
        // methods: ['GET', 'POST'],
        // allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
      }
})


io.on('connection',(socket)=>{
    console.log('connectionon');
    socket.on('setup',(userId)=>{
        console.log('connected');
        socket.join(userId)
        socket.emit('connected')
    })

    socket.on('joinChat',(room)=>{
        console.log(room);
        console.log('joined chat');
        socket.join(room);
    })

    socket.on('new message',(newMessage,room) => {
        console.log('message sendig',room);
        console.log(newMessage,'====');
        io.emit('messageResponse', newMessage,room);
     });

     socket.on('disconnect', () => {
        console.log("Socket disconnected");
    });
})

