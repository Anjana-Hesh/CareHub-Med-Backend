import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb'
import connectCloudinary from './config/cloudinary'
import addminRouter from './routes/addminRoute'

// app config
const app = express()
const port = process.env.PORT || 5000
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors())

// api endpoints
app.use('/api/v1/addmin', addminRouter)  // localhost:5000/api/v1/addmin/add-doctor

app.listen(port , () => console.log("Server started" , port))