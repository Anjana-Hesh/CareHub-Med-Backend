import { Request, Response } from "express"
import doctorModel from "../models/doctorModel"

const changeAvailability = async (req: Request,resp: Response) => {
    try {
        
        const {docId} = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId,{available: !docData.available})
        resp.json({
            success: true,
            message: "Availability changed ..."
        })

    } catch (error) {
        console.log(error)
        resp.json({
            success: false,
            message:error.message
        })
    }
}

export default changeAvailability