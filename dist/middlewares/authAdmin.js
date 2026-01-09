"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// admin authentication middleware
const authAdmin = async (req, resp, next) => {
    try {
        const atoken = req.headers.atoken;
        if (!atoken) {
            return resp.status(401).json({
                success: false,
                message: "Not authorized. Login again."
            });
        }
        const token_decode = jsonwebtoken_1.default.verify(atoken, process.env.JWT_SECRET);
        if (!token_decode.roles.includes('ADMIN')) {
            return resp.status(401).json({
                success: false,
                message: "Not authorized. Invalid admin token."
            });
        }
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
            message: "Admin auth issue",
            error: error instanceof Error ? error.message : error
        });
    }
};
exports.default = authAdmin;
