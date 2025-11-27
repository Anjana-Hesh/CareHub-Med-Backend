import { Request, Response } from "express";
import validator from "validator";
import bcrypt from "bcrypt";
import {User , IUSER} from "../models/userModel";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from "../models/doctorModel";
import appointmentModel from "../models/appointmentModel";
import { signAccessToken } from "../utils/token";

// export const registerUser = async (req: Request, resp: Response) => {
//   try {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password) {
//       return resp.status(400).json({
//         success: false,
//         message: "Missing required fields",
//       });
//     }

//     if (!validator.isEmail(email)) {
//       return resp.status(400).json({
//         success: false,
//         message: "Enter a valid email",
//       });
//     }

//     if (password.length < 8) {
//       return resp.status(400).json({
//         success: false,
//         message: "Enter a strong password (minimum 8 characters)",
//       });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newUser = new userModel({
//       name,
//       email,
//       password: hashedPassword,
//     });

//     const user = await newUser.save();

//     // Generate JWT
//     // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });

//     resp.status(201).json({
//       success: true,
//       // token,
//     });
//   } catch (error: any) {
//     console.error(error);
//     resp.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// API for user Login
// export const loginUser = async (req: Request, resp: Response) => {

//     try {

//         const { email , password} = req.body
//         const user = await userModel.findOne({email})

//         if (!user) {
//             return resp.json({
//             success: false,
//             message: "user doesn't exist",
//             });
//         }

//         const isMatch = await bcrypt.compare(password,user.password)
        
//         if (isMatch) {
//             const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: "30min" })  // ! non null asserted
//             // const token = signAccessToken(user)

//             resp.json({
//                 success: true,
//                 token
//             })
//         } else {
//             resp.json({
//                 success: false,
//                 message: "Invalid credentials ..."
//             })
//         }

//     } catch (error: any) {
//         console.error(error);
//         resp.status(500).json({
//         success: false,
//         message: error.message,
//         });
//     }

// }


// API to get user profile data
export const getProfile = async (req: Request, resp: Response) =>{

  try {

    const { userId } = req.body

    const userData = await User.findById(userId).select('-password') as IUSER | null

    resp.json({
      success: true,
      userData
    })
    
  } catch (error: any) {
      console.error(error);
      resp.status(500).json({
        success: false,
        message: error.message,
      });
  }

}

//API to update user profile
export const updateProfile = async (req: Request, resp: Response) => {

  try {

    const { userId , name , phone, address, dob, gender } = req.body
    const imageFile = req.file

    if (!name ||  !phone || !dob || !gender) {
      return resp.json({
        success: false,
        message: "Data missing"
      })
    }

    await User.findByIdAndUpdate(userId , {name , phone , address: JSON.parse(address), dob , gender}) as IUSER | null

    if (imageFile) {
      
      //upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: 'image'})
      const imageUrl = imageUpload.secure_url

      await User.findByIdAndUpdate(userId, {image: imageUrl})

    }

    resp.json({
      success: true,
      message: "Profile updated.."
    })

  } catch (error: any) {
      console.error(error);
      resp.status(500).json({
        success: false,
        message: error.message,
      });
  }

}

// API to book appointment
export const bookAppointment = async  (req: Request, resp: Response) => {

  try {
    
    const { userId, docId, slotDate, slotTime} = req.body

    const docData = await doctorModel.findById(docId).select('-password') 

    if (!docData.available) {
        return resp.json({
          success: false,
          message: "Doctor not available"
        })
    }

    let slots_booked = docData.slots_booked

    // checkin for slots availability
    if (slots_booked[slotDate]) {
       if (slots_booked[slotDate].includes(slotTime)) {
         return resp.json({
          success: false,
          message: "Slot not available"
        })
       } else {
        slots_booked[slotDate].push(slotTime)
       }
    } else {
       slots_booked[slotDate] = []
       slots_booked[slotDate].push(slotTime)
    }

    const userData = await User.findById(userId).select('-password') as IUSER | null

    delete docData.slots_booked

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now()
    }

    const newAppointment = new appointmentModel(appointmentData)
    await newAppointment.save()

    // save new slots data in docData
    await doctorModel.findByIdAndUpdate(docId,{slots_booked})

    resp.json({
      success: true,
      message: 'Appointment booked successfull ..'
    })

  } catch (error: any) {
      console.error(error);
      resp.status(500).json({
        success: false,
        message: error.message,
      });
  }

}

// API to get user Appointments for frontend my-appointment page
export const listAppointment = async (req: Request, resp: Response) => {
  try {
    
    const { userId } = req.body
    const appointments = await appointmentModel.find({userId})

    resp.json({
      success: true,
      appointments
    })

  } catch (error: any) {
      console.error(error);
      resp.status(500).json({
        success: false,
        message: error.message,
      });
  }
}

// API to cancel appointment
export const cancelAppintment = async (req: Request, resp: Response) => {

  try {

    const { userId , appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)

    // verify appointment user
    if (appointmentData.userId !== userId) {
       return resp.json({
        success: false,
        message: "Un-authorized action"
       })
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled: true})

    // releasing doctor slot
    const {docId, slotDate, slotTime} = appointmentData

    const doctorData = await doctorModel.findById(docId)

    let slots_booked = doctorData.slots_booked

    slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

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
