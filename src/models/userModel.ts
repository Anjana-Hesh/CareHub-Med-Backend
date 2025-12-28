import mongoose, { Document, Schema } from "mongoose"

export enum Role {
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  USER = "USER"
}

export interface IUSER extends Document {
    _id: mongoose.Types.ObjectId
    name: string
    email: string
    password: string
    image?: string
    address?: {
        line1: string
        line2: string
    }
    gender?: string
    dob?: string
    phone?: string
    roles?: Role[]
    passwordResetToken?: string
    passwordResetExpires?: number
    comparePassword(candidatePassword: string): Promise<boolean>
}

const userSchema = new mongoose.Schema<IUSER>({
    name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String, required:true},
    image:{type:String,default:"data:image/png;base64,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"},
    address:{type:Object, default:{line1:"" , line2:""}},
    gender:{type:String, default:"Not selected"},
    dob:{type:String, default:"Not selected"},
    phone:{type:String, default:"0000000000"},
    roles:{type: [String], enum: Object.values(Role), default: [Role.USER],
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Number }
  }
})

export const User = mongoose.model<IUSER>("User", userSchema)