import { Request, Response } from "express"
import validator from "validator"
import bcrypt from 'bcrypt'
import {v2 as cloudinary} from "cloudinary"
import doctorModel from "../models/doctorModel"
import jwt from "jsonwebtoken"

// Api for adding doctor
const addDoctor = async (req: Request , resp: Response) => {
    try{
        const {name , email , password , speciality , degree , experience , about ,fees ,address} = req.body
        const imageFile = req.file

        // console.log({name , email , password , speciality , degree , experience , about ,fees ,address} , imageFile)

        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return resp.status(401).json({
                success: false,
                message: "Missing some details ..."
            })
        }
        
        // validating email
        if (!validator.isEmail(email)) {
            return resp.status(401).json({
                success: false,
                message: "Please Enter a valid email"
            })
        }

        // validating password
        if (password.length < 8) {
            return resp.status(401).json({
                success: false,
                message: "Please Enter a strong password"
            })
        }

        // validate is image exist
        if (!imageFile) {
            return resp.status(400).json({
                success: false,
                message: "Doctor image is required"
            });
        }

        // hashing doc password
        const salt = await bcrypt.genSalt(10)  // increese security , genarating random salt with 10 rounds
        const hashedPassword = await bcrypt.hash(password , salt)

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type:"image"})
        const imageUrl = imageUpload.secure_url

        const doctorData = {
            name,
            email,
            image:imageUrl,
            password:hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address:JSON.parse(address),
            date:Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()

        resp.status(201).json({
            success:true,
            message: "Doctor added successfully"
        })
        
    }catch (error){
        console.log(error)
        resp.status(500).json({
            success:false,
            message: "Doctor adding error, ", error
        })
    }
}

// API for the admin login
const loginAdmin = async (req:Request , resp:Response) => {

    try{

        const {email , password} = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            
            const token = jwt.sign({ email, password }, process.env.JWT_SECRET as string, { expiresIn: "30m" });

            resp.status(200).json({
                success:true,
                message: "Success fully Login ...",
                token: token
            })

        } else {
            resp.status(401).json({
                success:false,
                message: "Invalid credensials ..."
            })
        }

    }catch (error){
        console.log(error)
        resp.status(500).json({
            success:false,
            message: "Doctor adding error, ", error
        })
    }
}

export {addDoctor , loginAdmin}