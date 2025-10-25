import express from 'express'
import { addDoctor, loginAdmin } from '../controllers/adminController'
import upload from '../middlewares/multer'
import authAdmin from '../middlewares/authAdmin'

const addminRouter = express.Router()

addminRouter.post('/add-doctor', authAdmin, upload.single('image'), addDoctor)
addminRouter.post('/login', loginAdmin)

export default addminRouter