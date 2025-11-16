import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET as string


export const signAccessToken = (user): string => {
  return jwt.sign({ 
            sub: user._id.toString(), 
            roles: user.roles
        },
        JWT_SECRET, {
        expiresIn: "30m"
  })
}