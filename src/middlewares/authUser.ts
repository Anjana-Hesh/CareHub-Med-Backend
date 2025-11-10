import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

// user authentication middleware
const authUser = async (req: Request, resp: Response, next: NextFunction) => {
    try {
        const token = req.headers.token as string;

        if (!token) {
            return resp.status(401).json({
                success: false,
                message: "Not authorized. Login again."
            });
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

        req.body.userId = token_decode.id
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
            message: "Admin auth issue",
            error: error instanceof Error ? error.message : error
        });
    }
}

export default authUser