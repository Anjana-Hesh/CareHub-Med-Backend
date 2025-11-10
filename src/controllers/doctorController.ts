import { Request, Response } from "express"
import doctorModel from "../models/doctorModel"

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

// export default {changeAvailability , doctorList};