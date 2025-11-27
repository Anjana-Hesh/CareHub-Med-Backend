import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

// Doctor authentication middleware
const authDoctor = async (req: Request, resp: Response, next: NextFunction) => {
    
    try {
        const dtoken = req.headers.dtoken as string;

        if (!dtoken) {
            return resp.status(401).json({
                success: false,
                message: "Not authorized. Login again."
            });
        }

        // const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET as string) as { id: string };
        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET as string) as { sub: string; roles: string[] };
        

        // Initialize req.body if it doesn't exist (important for GET requests)
        if (!req.body) {
            req.body = {};
        }
        
        req.body.docId = token_decode.sub;
        next();

    } catch (error) {
        console.log(error);
        
        // Handle specific JWT errors
        if (error instanceof jwt.TokenExpiredError) {
            return resp.status(401).json({
                success: false,
                message: "Token expired. Please login again.",
                expiredAt: error.expiredAt
            });
        }
        
        if (error instanceof jwt.JsonWebTokenError) {
            return resp.status(401).json({
                success: false,
                message: "Invalid token. Please login again."
            });
        }

        return resp.status(500).json({
            success: false,
            message: "Doctor auth issue",
            error: error instanceof Error ? error.message : error
        });
    }
}

export default authDoctor