import jwt from "jsonwebtoken"
import { IUSER } from "../models/userModel"

const JWT_SECRET = process.env.JWT_SECRET as string
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

export const signAccessToken = (user:IUSER): string => {
  return jwt.sign({ 
            sub: user._id.toString(), 
            roles: user.roles
        },
        JWT_SECRET, {
        expiresIn: "50m"
  })
}

export const signRefreshToken = (user: IUSER): string => {
  return jwt.sign({
      sub: user._id.toString()
    },
    JWT_REFRESH_SECRET,
    {expiresIn: "7d"}
  )
}