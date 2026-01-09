import { Request, Response } from "express"
import validator from "validator"
import bcrypt from 'bcrypt'
import {v2 as cloudinary} from "cloudinary"
import doctorModel from "../models/doctorModel"
import appointmentModel from "../models/appointmentModel"
import {User} from "../models/userModel"
// import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";


// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// export const generateDoctorDescription = async (req: Request, resp: Response) => {
//   try {
//     const { name, speciality, experience, degree } = req.body;

//     if (!name || !speciality || !experience || !degree) {
//       return resp.status(400).json({
//         success: false,
//         message: "Missing required fields",
//       });
//     }

//     const prompt = `
// Write a professional doctor profile description between 50 and 100 words.

// Doctor Name: ${name}
// Speciality: ${speciality}
// Experience: ${experience}
// Qualifications: ${degree}

// Tone: professional, patient-friendly, trustworthy.
// `;

//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.6,
//     });

//     resp.json({
//       success: true,
//       description: completion.choices[0].message.content,
//     });

//   } catch (error: any) {
//     console.error(error);
//     resp.status(500).json({
//       success: false,
//       message: "AI generation failed",
//     });
//   }
// };

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateDoctorDescription = async (req: Request, resp: Response) => {
  try {
    const { name, speciality, experience, degree } = req.body;

    if (!name || !speciality || !experience || !degree) {
      return resp.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Write a professional doctor profile description between 50 and 100 words.
      Doctor Name: ${name}
      Speciality: ${speciality}
      Experience: ${experience} years
      Qualifications: ${degree}
      Tone: professional, patient-friendly, trustworthy.
    `;

    const result = await model.generateContent(prompt);
    
    // safe check for response
    if (result && result.response) {
        const text = result.response.text();
        return resp.json({
            success: true,
            description: text,
        });
    } else {
        throw new Error("No response from AI");
    }

  } catch (error: any) {
    console.error("Gemini Error Details:", error);
    resp.status(500).json({
      success: false,
      message: "AI generation failed. Please try again later.",
      error: error.message
    });
  }
};

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

const allDoctors = async (req: Request , resp: Response) => {
    try {
        
        const doctors = await doctorModel.find({}).select('-password')  // to removed password in response
        resp.json({
            success: true ,
            doctors
        })

    } catch (error) {
        console.log(error)
        resp.status(500).json({
            success:false,
            message: "Doctor adding error, ", error
        })
    }
}

// API to get all appointmnet list
const appointmentAdmin = async (req: Request , resp: Response) => {

    try {
        
        const appointments = await (await appointmentModel.find({})).reverse()

        resp.json({
            success:true,
            appointments
        })

    } catch (error: any) {
        console.log(error)
        resp.status(500).json({
            success:false,
            message: error.message
        })
    }
}

// API for appointment cancelletion
const appointmentCancel = async (req: Request, resp: Response) => {

  try {

    const { appointmentId } = req.body

    if (!appointmentId) {
      return resp.status(400).json({
        success: false,
        message: 'Appointment ID is required',
      });
    }

    const appointmentData = await appointmentModel.findById(appointmentId)

    if (!appointmentData) {
      return resp.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled: true})

    // releasing doctor slot
    const {docId, slotDate, slotTime} = appointmentData

    const doctorData = await doctorModel.findById(docId)

    if (!doctorData) {
      return resp.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // let slots_booked = doctorData.slots_booked

    // slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

    const slots_booked: Record<string, string[]> =
      doctorData.slots_booked || {};

    if (slots_booked[slotDate]) {
      slots_booked[slotDate] = slots_booked[slotDate].filter(
        (time: string) => time !== slotTime
      );

      // Cleanup empty date key
      if (slots_booked[slotDate].length === 0) {
        delete slots_booked[slotDate];
      }
    }

    await doctorModel.findByIdAndUpdate(docId, {slots_booked})

    resp.json({
      success: true,
      message: 'Appointment cancelled'
    })
    
  } catch (error: any) {
      console.error(error);
      resp.status(500).json({
        success: false,
        message: error.message,
      });
  }

}

// API to get dashboard data for admin panel
const adminDashboard = async (req: Request, resp: Response) => {

    try {

        const doctors = await doctorModel.find({})
        const users = await User.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0,5)
        }
        
        resp.json({
            success: true,
            dashData
        })

    } catch (error: any) {
        console.error(error);
        resp.status(500).json({
            success: false,
            message: error.message,
      });
    }

}

export {addDoctor , allDoctors , appointmentAdmin, appointmentCancel , adminDashboard}