import { Request, Response } from "express";
import {User , IUSER} from "../models/userModel";
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from "../models/doctorModel";
import appointmentModel from "../models/appointmentModel";
import { sendEmail } from "../config/emailConfig";

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

    if (!userData) {
       return resp.status(404).json({ success: false, message: "User not found" });
    }

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

   try {
        const userHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #4CAF50;">✅ Appointment Confirmed, ${userData.name}!</h2>
                <p>Thank you for booking your appointment. Please review the details below:</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Doctor:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">Dr. ${docData.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Specialization:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${docData.specialization || 'Not specified'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date:</td>
                        <td style="padding: 8px; border: 1px solid #ddd; color: #007bff;">${slotDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Time:</td>
                        <td style="padding: 8px; border: 1px solid #ddd; color: #dc3545;">${slotTime}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Appointment ID:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${newAppointment._id}</td>
                    </tr>
                </table>
                <p style="margin-top: 20px; font-size: 12px; color: #888;">*Please bring your ID and be 10 minutes early.</p>
            </div>
        `;

        await sendEmail({
            to: userData.email,
            subject: `✅ Your Appointment is Confirmed with Dr. ${docData.name}`,
            html: userHtml,
        });

    } catch (emailError) {
        console.error('Failed to send USER booking confirmation email:', emailError);
    }
    
    // --- 2. Email for the Doctor (Wenas Widihata - Different Content) ---
    try {
        const doctorHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #007bff; border-radius: 8px;">
                <h3 style="color: #007bff;">🔔 New Appointment Booked</h3>
                <p>Dear Dr. ${docData.name},</p>
                <p>A new appointment has been scheduled for your practice. Please review the details:</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Patient Name:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${userData.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Patient Contact:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${userData.phone || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Date:</td>
                        <td style="padding: 8px; border: 1px solid #ddd; color: #dc3545;">${slotDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Time Slot:</td>
                        <td style="padding: 8px; border: 1px solid #ddd; color: #dc3545;">${slotTime}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Amount Due:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${docData.fees}</td>
                    </tr>
                </table>
                <p style="margin-top: 20px; font-style: italic;">This slot has been reserved in your schedule.</p>
            </div>
        `;

        await sendEmail({
            to: docData.email, // Assuming doctorModel has an 'email' field
            subject: `🔔 NEW Booking: ${slotDate} at ${slotTime} - Patient: ${userData.name}`,
            html: doctorHtml,
        });

    } catch (emailError) {
        console.error('Failed to send DOCTOR notification email:', emailError);
    }

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

    // ------------------------------------
    // 📧 SEND APPOINTMENT CANCELLATION EMAIL
    // ------------------------------------
    const userData = await User.findById(userId).select('name email') as IUSER | null
    
    if (userData) {
      try {
          const emailHtml = `
              <h1>Appointment Cancellation Confirmation</h1>
              <p>Dear ${userData.name},</p>
              <p>Your appointment on <strong>${slotDate} at ${slotTime}</strong> has been successfully **cancelled**.</p>
              <p>If this was a mistake, please book a new appointment.</p>
          `;

          await sendEmail({
              to: userData.email, // Assuming IUSER has an 'email' field
              subject: '❌ Appointment Cancelled',
              html: emailHtml,
          });

      } catch (emailError) {
          // Log the error but do NOT fail the main response, as the cancellation is complete.
          console.error('Failed to send cancellation confirmation email:', emailError);
      }
    }

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



