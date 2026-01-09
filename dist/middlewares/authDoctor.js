"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Doctor authentication middleware
const authDoctor = async (req, resp, next) => {
    try {
        const dtoken = req.headers.dtoken;
        if (!dtoken) {
            return resp.status(401).json({
                success: false,
                message: "Not authorized. Login again."
            });
        }
        // const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET as string) as { id: string };
        const token_decode = jsonwebtoken_1.default.verify(dtoken, process.env.JWT_SECRET);
        // Initialize req.body if it doesn't exist (important for GET requests)
        if (!req.body) {
            req.body = {};
        }
        req.body.docId = token_decode.sub;
        next();
    }
    catch (error) {
        console.log(error);
        // Handle specific JWT errors
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return resp.status(401).json({
                success: false,
                message: "Token expired. Please login again.",
                expiredAt: error.expiredAt
            });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
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
};
exports.default = authDoctor;
