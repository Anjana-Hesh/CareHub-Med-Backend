"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.login = exports.registerUser = exports.googleLogin = void 0;
const userModel_1 = require("../models/userModel");
const bcrypt_1 = __importDefault(require("bcrypt"));
const token_1 = require("../utils/token");
const doctorModel_1 = __importDefault(require("../models/doctorModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID?.trim());
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required"
            });
        }
        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID?.trim()
        });
        const payload = ticket.getPayload();
        console.log('Google token payload:', payload); // debug
        if (!payload || !payload.email) {
            return res.status(400).json({
                success: false,
                message: "Invalid Google token"
            });
        }
        const { email, name, picture, sub: googleId } = payload;
        // Check if user exists
        let user = await userModel_1.User.findOne({ email });
        if (user) {
            // User exists, generate tokens
            const token = (0, token_1.signAccessToken)(user);
            const refresh_token = (0, token_1.signRefreshToken)(user);
            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    email: user.email,
                    roles: user.roles,
                    token,
                    refresh_token
                }
            });
        }
        // Check if email belongs to a doctor
        const doctor = await doctorModel_1.default.findOne({ email });
        if (doctor) {
            return res.status(403).json({
                success: false,
                message: "This email is registered as a doctor. Please use regular login."
            });
        }
        // Check if email is admin
        if (email === process.env.ADMIN_EMAIL) {
            return res.status(403).json({
                success: false,
                message: "Admin account cannot use Google login."
            });
        }
        // Create new user
        user = await userModel_1.User.create({
            email,
            name: name || "Google User",
            password: `google_${googleId}_${Date.now()}`, // Random password
            image: picture || undefined,
            roles: [userModel_1.Role.USER]
        });
        const token = (0, token_1.signAccessToken)(user);
        const refresh_token = (0, token_1.signRefreshToken)(user);
        res.status(201).json({
            success: true,
            message: "Account created and logged in successfully",
            data: {
                email: user.email,
                roles: user.roles,
                token,
                refresh_token
            }
        });
    }
    catch (error) {
        console.error('Google login error:', error);
        if (error.message.includes('Wrong recipient') || error.message.includes('audience')) {
            return res.status(400).json({
                success: false,
                message: "Google token audience mismatch. Check your GOOGLE_CLIENT_ID."
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || "Google authentication failed"
        });
    }
};
exports.googleLogin = googleLogin;
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await userModel_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email exists" });
        }
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        const user = await userModel_1.User.create({
            email,
            name,
            password: hashedPassword,
            roles: [userModel_1.Role.USER]
        });
        res.status(201).json({
            message: "User registed",
            data: { email: user.email, roles: user.roles }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal; server error"
        });
    }
};
exports.registerUser = registerUser;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const admin = { _id: "admin_id", roles: [userModel_1.Role.ADMIN] };
            const token = (0, token_1.signAccessToken)(admin);
            const refresh_token = (0, token_1.signRefreshToken)(admin);
            return res.status(200).json({
                success: true,
                message: "Admin login successful",
                data: {
                    roles: [userModel_1.Role.ADMIN],
                    token,
                    refresh_token
                }
            });
        }
        const doctor = await doctorModel_1.default.findOne({ email });
        if (doctor) {
            const isMatch = await bcrypt_1.default.compare(password, doctor.password);
            if (!isMatch)
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });
            const doc = { _id: doctor._id, roles: [userModel_1.Role.DOCTOR] };
            const token = (0, token_1.signAccessToken)(doc);
            const refresh_token = (0, token_1.signRefreshToken)(doc);
            return res.status(200).json({
                success: true,
                message: "Doctor login successful",
                data: {
                    roles: [userModel_1.Role.DOCTOR],
                    token,
                    refresh_token
                }
            });
        }
        const user = await userModel_1.User.findOne({ email });
        if (user) {
            const isMatch = await bcrypt_1.default.compare(password, user.password);
            if (!isMatch)
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });
            const token = (0, token_1.signAccessToken)(user);
            const refresh_token = (0, token_1.signRefreshToken)(user);
            return res.status(200).json({
                success: true,
                message: "User login successful",
                data: {
                    email: user.email,
                    roles: user.roles,
                    token,
                    refresh_token
                }
            });
        }
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Token required ..." });
        }
        // import jwt from "jwtwebtoken"
        const payload = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
        const user = await userModel_1.User.findById(payload.sub);
        if (!user) {
            return res.status(403).json({ message: "Invalid refresh token ..." });
        }
        const accessToken = (0, token_1.signAccessToken)(user);
        res.status(200).json({
            accessToken
        });
    }
    catch (error) {
        res.status(403).json({ message: "Invalid or expire token" });
    }
};
exports.refreshToken = refreshToken;
