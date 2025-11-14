import { Request, Response } from "express"
import doctorModel from "../models/doctorModel"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel"

export const changeAvailability = async (req: Request,resp: Response) => {
    try {
        
        const {docId} = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId,{available: !docData.available})
        resp.json({
            success: true,
            message: "Availability changed ..."
        })

    } catch (error: any) {
        console.log(error)
        resp.json({
            success: false,
            message:error.message
        })
    }
}

export const doctorList = async (req: Request,resp: Response) => {
     try {
        
        const doctors =  await doctorModel.find({}).select(['-password', '-email'])   // remove password and email saving
        resp.status(200).json({
            success : true,
            doctors
        })

     } catch (error: any) {
        console.log(error)
        resp.status(500).json({
            success: false,
            message:error.message
        })
     }
}

// API for doctor login
export const loginDoctor = async (req: Request,resp: Response) => {

    try {

        const { email , password} = req.body
        const doctor = await doctorModel.findOne({email})

        if (!doctor) {
            return resp.json({
                success: false,
                message: "Invalid credentials"
            })
        }

        const isMatch = await bcrypt.compare(password, doctor.password)
        if (isMatch) {
            
            const token = jwt.sign({id:doctor._id} , process.env.JWT_SECRET as string)

            resp.json({success: true, token})

        } else {
            resp.json({success: false , message: " Invalid credentials"})
        }
        
    } catch (error:any) {
        console.log(error)
        resp.status(500).json({
            success: false,
            message:error.message
        })
    }

}

// API to get doctor appointments for doctor panel
export const appointmentDoctor = async (req: Request,resp: Response) => {

    try {
        
        const { docId } = req.body
        const appointments = await appointmentModel.find({docId})

        resp.json({
            success: true,
            appointments
        })

    } catch (error: any) {
        console.log(error)
        resp.status(500).json({
            success: false,
            message:error.message
        })
    }

}

// API to mark appointment completed for doctor panel
export const appointmentComplete = async (req: Request,resp: Response) => {

    try {

        const {docId , appointmentId} = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (appointmentData && appointmentData.docId === docId) {
            
            await appointmentModel.findByIdAndUpdate(appointmentId , {isCompleted: true})
            return resp.json({
                success: true,
                message: 'Appointment Completed ...'
            })

        } else {
            return resp.json({
                success: false,
                message: 'Mark Failed ...'
            })
        }

    } catch (error: any) {
        console.log(error)
        resp.status(500).json({
            success: false,
            message:error.message
        })
    }

}

// API to cancel appointment for doctor panel
export const appointmentCancel = async (req: Request,resp: Response) => {

    try {

        const {docId , appointmentId} = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (appointmentData && appointmentData.docId === docId) {
            
            await appointmentModel.findByIdAndUpdate(appointmentId , {cancelled: true})
            return resp.json({
                success: true,
                message: 'Appointment Cancelled ...'
            })

        } else {
            return resp.json({
                success: false,
                message: 'Cancelation Failed ...'
            })
        }

    } catch (error: any) {
        console.log(error)
        resp.status(500).json({
            success: false,
            message:error.message
        })
    }

}

//API to get dashboard data for doctors
export const doctorDashboard = async (req: Request,resp: Response) => {

    try {

        const {docId} = req.body

        const appointments = await appointmentModel.find({docId})

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients:any = []

        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse().slice(0,5)
        }

        resp.json({
            success: true,
            dashData
        })
        
    } catch (error: any) {
        console.log(error)
        resp.status(500).json({
            success: false,
            message:error.message
        })
    }

}

// export default {changeAvailability , doctorList};