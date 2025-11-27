// import { NextFunction, Request, Response } from 'express'
// import jwt from 'jsonwebtoken'

// // user authentication middleware
// const authUser = async (req: Request, resp: Response, next: NextFunction) => {
//     try {
//         const token = req.headers.token as string;

//         if (!token) {
//             return resp.status(401).json({
//                 success: false,
//                 message: "Not authorized. Login again."
//             });
//         }

//         const token_decode = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

//         // Initialize req.body if it doesn't exist (important for GET requests)
//         if (!req.body) {
//             req.body = {};
//         }
        
//         req.body.userId = token_decode.id;
//         next();

//     } catch (error) {
//         console.log(error);
        
//         // Handle specific JWT errors
//         if (error instanceof jwt.TokenExpiredError) {
//             return resp.status(401).json({
//                 success: false,
//                 message: "Token expired. Please login again.",
//                 expiredAt: error.expiredAt
//             });
//         }
        
//         if (error instanceof jwt.JsonWebTokenError) {
//             return resp.status(401).json({
//                 success: false,
//                 message: "Invalid token. Please login again."
//             });
//         }

//         return resp.status(500).json({
//             success: false,
//             message: "User auth issue",
//             error: error instanceof Error ? error.message : error
//         });
//     }
// }

// export default authUser

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const authUser = async (req: Request, resp: Response, next: NextFunction) => {
    try {
        const token = req.headers.token as string;

        if (!token) {
            return resp.status(401).json({
                success: false,
                message: "Not authorized. Login again."
            });
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET as string) as { sub: string; roles: string[] };

        if (!req.body) req.body = {};

        req.body.userId = token_decode.sub;
        req.body.roles = token_decode.roles;

        next();
    } catch (error) {
        console.log(error);

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
            message: "User auth issue",
            error: error instanceof Error ? error.message : error
        });
    }
}

export default authUser;
