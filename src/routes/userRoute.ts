import express from 'express'
import { bookAppointment, cancelAppintment, getProfile, listAppointment, loginUser, updateProfile } from '../controllers/userController'
import authUser from '../middlewares/authUser'
import upload from '../middlewares/multer'
import { login, refreshToken, registerUser } from '../controllers/authcontroller'

const userRouter = express.Router()

userRouter.post('/register',registerUser)
userRouter.post('/login', login)
userRouter.post("/refresh", refreshToken)
userRouter.get('/get-profile', authUser, getProfile)
userRouter.post('/update-profile' , upload.single('image') , authUser ,updateProfile)
userRouter.post('/book-appointment', authUser, bookAppointment)
userRouter.get('/appointments', authUser, listAppointment)
userRouter.post('/cancel-appointment', authUser, cancelAppintment)

export default userRouter