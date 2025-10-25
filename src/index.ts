import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb'
import connectCloudinary from './config/cloudinary'

// app config
const app = express()
const port = process.env.PORT || 5000
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors())

// api endpoints
app.get('/',(req , resp) => {
    resp.send('Api working')
})

app.listen(port , () => console.log("Server started" , port))