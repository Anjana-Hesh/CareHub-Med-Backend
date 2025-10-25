import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

// admin authentication middleware
const authAdmin = async (req: Request, resp: Response, next: NextFunction) => {

    try {
        const atoken = req.headers.atoken as string;

        if (!atoken) {
            return resp.status(401).json({
                success: false,
                message: "Not authorized. Login again."
            });
        }

        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET as string) as { email: string };

        if (token_decode.email !== process.env.ADMIN_EMAIL) {
            return resp.status(401).json({
                success: false,
                message: "Not authorized. Invalid admin token."
            });
        }

        next();

    } catch (error) {
        console.log(error);
        return resp.status(500).json({
            success: false,
            message: "Admin auth issue",
            error: error instanceof Error ? error.message : error
        });
    }

}

export default authAdmin
