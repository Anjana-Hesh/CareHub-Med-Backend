import { Request, Response } from "express";
import {User , IUSER} from "../models/userModel";
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from "../models/doctorModel";
import appointmentModel from "../models/appointmentModel";
import { sendEmail } from "../config/emailConfig";
import * as crypto from 'crypto';
import bcrypt from 'bcrypt';

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

    // Send email part -----------------------------

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

    // slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

    if (slots_booked?.[slotDate]) {
        slots_booked[slotDate] = slots_booked[slotDate].filter(
            (e: string) => e !== slotTime
        );
    }


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

const findAccountByEmail = async (email: string) => {
    let account = await User.findOne({ email });
    let modelName = 'User';

    if (!account) {
        account = await doctorModel.findOne({ email });
        modelName = 'Doctor';
    }

    if (account) {
        return { account: account as any, modelName };
    }
    
    return null;
}

// Forget Password - Generate token and send email
export const forgetPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email is required.' 
        });
    }

    try {
        const result = await findAccountByEmail(email);

        if (!result) {
            return res.status(200).json({ 
                success: true, 
                message: 'If an account with that email exists, a password reset link has been sent.' 
            });
        }

        const { account, modelName } = result;

        // Generate simple random token - NO HASHING
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Store plain token directly
        account.passwordResetToken = resetToken;
        account.passwordResetExpires = Date.now() + 3600000; // 1 hour

        await account.save({ validateBeforeSave: false });

        console.log('✅ Token saved:', resetToken);

        const resetURL = `http://localhost:5173/reset-password/${resetToken}`;

        const resetEmailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>Password Reset Request</h2>
                <p>Dear ${account.name || 'User'},</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${resetURL}" 
                       style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                        Reset Password
                    </a>
                </p>
                <p>Or copy this link: ${resetURL}</p>
                <p>This link expires in 1 hour.</p>
            </div>
        `;

        try {
            await sendEmail({
                to: account.email,
                subject: `Password Reset Request`,
                html: resetEmailHtml,
            });

            res.status(200).json({
                success: true,
                message: 'Password reset link sent successfully.',
            });
        } catch (err) {
            account.passwordResetToken = undefined;
            account.passwordResetExpires = undefined;
            await account.save({ validateBeforeSave: false });

            console.error('Email sending failed:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error sending email. Please try again later.' 
            });
        }

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error.' 
        });
    }
};

// Reset Password - Simple token check

export const resetPassword = async (req: Request, res: Response) => {
    const token = req.headers["x-reset-token"] as string;
    const { newPassword } = req.body;

    console.log('🔄 Reset password request');
    console.log('   Token:', token ? `${token.substring(0, 20)}...` : 'None');
    console.log('   New password length:', newPassword?.length);

    if (!token) {
        console.log('❌ No token provided');
        return res.status(400).json({
            success: false,
            message: 'Reset token missing.'
        });
    }

    if (!newPassword || newPassword.length < 6) {
        console.log('❌ Invalid password length');
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long.'
        });
    }

    try {
        // Find account
        console.log('🔍 Searching for account with token...');
        let account = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        let accountType = 'User';
        
        if (!account) {
            console.log('🔍 Not found in User, searching Doctor...');
            account = await doctorModel.findOne({
                passwordResetToken: token,
                passwordResetExpires: { $gt: Date.now() }
            });
            accountType = 'Doctor';
        }

        if (!account) {
            console.log('❌ Token not found or expired');
            return res.status(400).json({
                success: false,
                message: "Token is invalid or expired."
            });
        }

        console.log(`✅ ${accountType} account found:`, account.email);

        // Method 1: Using pre-save middleware
        console.log('🔧 Setting new password...');
        account.password = newPassword;
        account.passwordResetToken = undefined;
        account.passwordResetExpires = undefined;
        
        console.log('💾 Saving account...');
        const savedAccount = await account.save();
        
        // Verify password was hashed
        const savedPassword = (savedAccount as any).password;
        console.log('🔍 Saved password starts with:', savedPassword.substring(0, 10));
        console.log('🔍 Is password hashed?', savedPassword.startsWith('$2b$'));
        
        if (!savedPassword.startsWith('$2b$')) {
            console.warn('⚠️ Password was NOT hashed!');
            // Fallback: Hash manually and save again
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            savedAccount.password = hashedPassword;
            await savedAccount.save({ validateBeforeSave: false });
            console.log('✅ Password manually hashed and saved');
        }

        console.log('✅ Password reset successful');

        return res.status(200).json({
            success: true,
            message: "Password updated successfully."
        });

    } catch (err: any) {
        console.error('❌ Reset password error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || "Server error."
        });
    }
};