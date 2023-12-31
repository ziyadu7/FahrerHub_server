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

const corsOptions = {
    origin: [process.env.BACKENDURL,process.env.FRONTENDURL],
    methods: ['GET', 'POST', 'PUT', 'DELETE' , 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],   
  };
  
app.use(cors(corsOptions));
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

// CRON //

const { spawn } = require('child_process');

const expiredRentMailSending = spawn('node', ['./cronFile/sendMailCron.js']);

expiredRentMailSending.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

expiredRentMailSending.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

expiredRentMailSending.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
});


const io = require('socket.io')(server,{
    cors: {
        origin:[process.env.BACKENDURL,process.env.FRONTENDURL],
        // methods: ['GET', 'POST'],
        // allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
      }
})


io.on('connection',(socket)=>{
    socket.on('setup',(userId)=>{
        socket.join(userId)
        socket.emit('connected')
    })

    socket.on('joinChat',(room)=>{
        socket.join(room);
    })

    socket.on('new message',(newMessage,room) => {
        io.emit('messageResponse', newMessage,room);
     });

     socket.on('disconnect', () => {
        console.log("Socket disconnected");
    });
})

