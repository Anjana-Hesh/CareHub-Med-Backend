import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb'
import connectCloudinary from './config/cloudinary'
import addminRouter from './routes/addminRoute'
import doctorRouter from './routes/doctorRoute'
import userRouter from './routes/userRoute'

// app config
const app = express()
const port = process.env.PORT || 5000
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors())

// api endpoints
app.get('/', (req, resp) => resp.send('CareHub Med Backend is running...'))
app.use('/api/v1/admin', addminRouter)  // localhost:5000/api/v1/addmin/add-doctor
app.use('/api/v1/doctor' , doctorRouter)
app.use('/api/v1/user', userRouter)

app.listen(port , () => console.log("Server started" , port))