"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authUser = async (req, resp, next) => {
    try {
        const token = req.headers.token;
        if (!token) {
            return resp.status(401).json({
                success: false,
                message: "Not authorized. Login again."
            });
        }
        const token_decode = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!req.body)
            req.body = {};
        req.body.userId = token_decode.sub;
        req.body.roles = token_decode.roles;
        next();
    }
    catch (error) {
        console.log(error);
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
            message: "User auth issue",
            error: error instanceof Error ? error.message : error
        });
    }
};
exports.default = authUser;
