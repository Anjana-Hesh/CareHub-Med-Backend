import { Request, Response } from "express"
import {IUSER, Role, User} from "../models/userModel"
import bcrypt from "bcrypt"
import {v2 as cloudinary} from 'cloudinary'
import { signAccessToken } from "../utils/token"
import doctorModel from "../models/doctorModel"
import jwt from 'jsonwebtoken'

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // left email form model, right side data varible
    //   User.findOne({ email: email })
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email exists" })
    }

    // const hash = await bcrypt.hash(password, 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //   new User()
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

// export const login = async (req: Request, res: Response) => {
//   try {
//     const { email, password } = req.body

//     const existingUser = (await User.findOne({ email })) as IUSER | null
//     if (!existingUser) {
//       return res.status(401).json({ message: "Invalid credentials" })
//     }

//     const valid = await bcrypt.compare(password, existingUser.password)
//     if (!valid) {
//       return res.status(401).json({ message: "Invalid credentials" })
//     }

//     const token = signAccessToken(existingUser)
//     // const refreshToken = signRefreshToken(existingUser)

//     res.status(200).json({
//       message: "success",
//       data: {
//         email: existingUser.email,
//         roles: existingUser.roles,
//         token
//         // refreshToken
//       }
//     })
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({
//       message: "Internal; server error"
//     })
//   }
// }



export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Admin
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const admin = { _id: "admin_id", roles: [Role.ADMIN] };
      const token = signAccessToken(admin);
      return res.status(200).json({ success: true, message: "Admin login successful", data: { roles: [Role.ADMIN], token } });
    }

    // 2️⃣ Doctor
    const doctor = await doctorModel.findOne({ email });
    if (doctor) {
      const isMatch = await bcrypt.compare(password, doctor.password);
      if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

      const token = signAccessToken({ _id: doctor._id, roles: [Role.DOCTOR] });
      return res.status(200).json({ success: true, message: "Doctor login successful", data: { roles: [Role.DOCTOR], token } });
    }

    // 3️⃣ User
    const user = await User.findOne({ email }) as IUSER | null;
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

      const token = signAccessToken(user);
      return res.status(200).json({ success: true, message: "User login successful", data: { email: user.email, roles: user.roles, token } });
    }

    // No user found
    res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

