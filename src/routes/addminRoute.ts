import express from 'express'
import { addDoctor, allDoctors, loginAdmin } from '../controllers/adminController'
import upload from '../middlewares/multer'
import authAdmin from '../middlewares/authAdmin'
import {changeAvailability }from '../controllers/doctorController'

const addminRouter = express.Router()

addminRouter.post('/add-doctor', authAdmin, upload.single('image'), addDoctor)
addminRouter.post('/login', loginAdmin)
addminRouter.post('/all-doctors', authAdmin, allDoctors)
addminRouter.post('/change-availability', authAdmin, changeAvailability)

export default addminRouter