import { Request, Response } from "express"
import {IUSER, Role, User} from "../models/userModel"
import bcrypt from "bcrypt"
import { signAccessToken, signRefreshToken } from "../utils/token"
import doctorModel from "../models/doctorModel"
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID?.trim())

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required"
      })
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID?.trim()
    })

    const payload = ticket.getPayload()

    console.log('Google token payload:', payload) // debug

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google token"
      })
    }

    const { email, name, picture, sub: googleId } = payload

    // Check if user exists
    let user = await User.findOne({ email }) as IUSER | null

    if (user) {
      // User exists, generate tokens
      const token = signAccessToken(user)
      const refresh_token = signRefreshToken(user)

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          email: user.email,
          roles: user.roles,
          token,
          refresh_token
        }
      })
    }

    // Check if email belongs to a doctor
    const doctor = await doctorModel.findOne({ email })
    if (doctor) {
      return res.status(403).json({
        success: false,
        message: "This email is registered as a doctor. Please use regular login."
      })
    }

    // Check if email is admin
    if (email === process.env.ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Admin account cannot use Google login."
      })
    }

    // Create new user
    user = await User.create({
      email,
      name: name || "Google User",
      password: `google_${googleId}_${Date.now()}`, // Random password
      image: picture || undefined,
      roles: [Role.USER]
    }) as IUSER

    const token = signAccessToken(user)
    const refresh_token = signRefreshToken(user)

    res.status(201).json({
      success: true,
      message: "Account created and logged in successfully",
      data: {
        email: user.email,
        roles: user.roles,
        token,
        refresh_token
      }
    })

  } catch (error: any) {
    console.error('Google login error:', error)

    if (error.message.includes('Wrong recipient') || error.message.includes('audience')) {
      return res.status(400).json({
        success: false,
        message: "Google token audience mismatch. Check your GOOGLE_CLIENT_ID."
      })
    }

    res.status(500).json({
      success: false,
      message: error.message || "Google authentication failed"
    })
  }
}


export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email exists" })
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      roles: [Role.USER]
    })

    res.status(201).json({
      message: "User registed",
      data: { email: user.email, roles: user.roles }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Internal; server error"
    })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const admin = { _id: "admin_id", roles: [Role.ADMIN] };
      const token = signAccessToken(admin);
      const refresh_token = signRefreshToken(admin)
      return res.status(200).json({
         success: true, 
         message: "Admin login successful", 
         data: { 
          roles: [Role.ADMIN], 
          token,
          refresh_token
         } 
      });
    }

    const doctor = await doctorModel.findOne({ email });
    if (doctor) {
      const isMatch = await bcrypt.compare(password, doctor.password);
      if (!isMatch) return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });

        const token = signAccessToken({ _id: doctor._id, roles: [Role.DOCTOR] });
        const refresh_token = signRefreshToken({ _id: doctor._id, roles: [Role.DOCTOR] })
        
        return res.status(200).json({ 
          success: true, 
          message: "Doctor login successful", 
          data: { 
            roles: [Role.DOCTOR], 
            token,
            refresh_token
          } 
        });
    }

    const user = await User.findOne({ email }) as IUSER | null;
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });

        const token = signAccessToken(user);
        const refresh_token = signRefreshToken(user);
        return res.status(200).json({ 
          success: true, 
          message: "User login successful", 
          data: { 
            email: user.email, 
            roles: user.roles, 
            token,
            refresh_token
          } 
        });
    }

    res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    
    const { token } = req.body

    if (!token) {
      return res.status(400).json({message: "Token required ..."})
    }

    // import jwt from "jwtwebtoken"
    const payload: any = jwt.verify(token, JWT_REFRESH_SECRET)
    const user = await User.findById(payload.sub)

    if (!user) {
      return res.status(403).json({message: "Invalid refresh token ..."})
    }

    const accessToken = signAccessToken(user)

    res.status(200).json({
      accessToken
    })

  } catch (error) {
    res.status(403).json({message: "Invalid or expire token"})
  }
}

