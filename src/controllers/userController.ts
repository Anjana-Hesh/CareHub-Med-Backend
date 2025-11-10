import { Request, Response } from "express";
import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel";
import jwt from "jsonwebtoken";

export const registerUser = async (req: Request, resp: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return resp.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!validator.isEmail(email)) {
      return resp.status(400).json({
        success: false,
        message: "Enter a valid email",
      });
    }

    if (password.length < 8) {
      return resp.status(400).json({
        success: false,
        message: "Enter a strong password (minimum 8 characters)",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });

    resp.status(201).json({
      success: true,
      token,
    });
  } catch (error: any) {
    console.error(error);
    resp.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API for user Login
export const loginUser = async (req: Request, resp: Response) => {

    try {

        const { email , password} = req.body
        const user = await userModel.findOne({email})

        if (!user) {
            return resp.json({
            success: false,
            message: "user doesn't exist",
            });
        }

        const isMatch = await bcrypt.compare(password,user.password)
        
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: "1d" })  // ! non null asserted
            resp.json({
                success: true,
                token
            })
        } else {
            resp.json({
                success: false,
                message: "Invalid credentials ..."
            })
        }

    } catch (error: any) {
        console.error(error);
        resp.status(500).json({
        success: false,
        message: error.message,
        });
    }

}
