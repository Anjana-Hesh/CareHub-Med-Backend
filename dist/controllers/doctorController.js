"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDoctorProfile = exports.doctorProfile = exports.doctorDashboard = exports.appointmentCancel = exports.appointmentComplete = exports.appointmentDoctor = exports.loginDoctor = exports.doctorList = exports.changeAvailability = void 0;
const doctorModel_1 = __importDefault(require("../models/doctorModel"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const appointmentModel_1 = __importDefault(require("../models/appointmentModel"));
const changeAvailability = async (req, resp) => {
    try {
        const { docId } = req.body;
        const docData = await doctorModel_1.default.findById(docId);
        await doctorModel_1.default.findByIdAndUpdate(docId, { available: !docData.available });
        resp.json({
            success: true,
            message: "Availability changed ..."
        });
    }
    catch (error) {
        console.log(error);
        resp.json({
            success: false,
            message: error.message
        });
    }
};
exports.changeAvailability = changeAvailability;
const doctorList = async (req, resp) => {
    try {
        const doctors = await doctorModel_1.default.find({}).select(['-password', '-email']); // remove password and email saving
        resp.status(200).json({
            success: true,
            doctors
        });
    }
    catch (error) {
        console.log(error);
        resp.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.doctorList = doctorList;
// API for doctor login
const loginDoctor = async (req, resp) => {
    try {
        const { email, password } = req.body;
        const doctor = await doctorModel_1.default.findOne({ email });
        if (!doctor) {
            return resp.json({
                success: false,
                message: "Invalid credentials"
            });
        }
        const isMatch = await bcrypt_1.default.compare(password, doctor.password);
        if (isMatch) {
            const token = jsonwebtoken_1.default.sign({ id: doctor._id }, process.env.JWT_SECRET);
            // const token = signAccessToken(doctor)
            resp.json({ success: true, token });
        }
        else {
            resp.json({ success: false, message: " Invalid credentials" });
        }
    }
    catch (error) {
        console.log(error);
        resp.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.loginDoctor = loginDoctor;
// API to get doctor appointments for doctor panel
const appointmentDoctor = async (req, resp) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel_1.default.find({ docId });
        resp.json({
            success: true,
            appointments
        });
    }
    catch (error) {
        console.log(error);
        resp.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.appointmentDoctor = appointmentDoctor;
// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, resp) => {
    try {
        const { docId, appointmentId } = req.body;
        const appointmentData = await appointmentModel_1.default.findById(appointmentId);
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel_1.default.findByIdAndUpdate(appointmentId, { isCompleted: true });
            return resp.json({
                success: true,
                message: 'Appointment Completed ...'
            });
        }
        else {
            return resp.json({
                success: false,
                message: 'Mark Failed ...'
            });
        }
    }
    catch (error) {
        console.log(error);
        resp.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.appointmentComplete = appointmentComplete;
// API to cancel appointment for doctor panel
const appointmentCancel = async (req, resp) => {
    try {
        const { docId, appointmentId } = req.body;
        const appointmentData = await appointmentModel_1.default.findById(appointmentId);
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel_1.default.findByIdAndUpdate(appointmentId, { cancelled: true });
            return resp.json({
                success: true,
                message: 'Appointment Cancelled ...'
            });
        }
        else {
            return resp.json({
                success: false,
                message: 'Cancelation Failed ...'
            });
        }
    }
    catch (error) {
        console.log(error);
        resp.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.appointmentCancel = appointmentCancel;
//API to get dashboard data for doctors
const doctorDashboard = async (req, resp) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel_1.default.find({ docId });
        let earnings = 0;
        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount;
            }
        });
        let patients = [];
        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId);
            }
        });
        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse().slice(0, 5)
        };
        resp.json({
            success: true,
            dashData
        });
    }
    catch (error) {
        console.log(error);
        resp.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.doctorDashboard = doctorDashboard;
// API to get doctor profile for doctor panel
const doctorProfile = async (req, resp) => {
    try {
        const { docId } = req.body;
        const profileData = await doctorModel_1.default.findById(docId).select('-password');
        resp.json({
            success: true,
            profileData
        });
    }
    catch (error) {
        console.log(error);
        resp.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.doctorProfile = doctorProfile;
// API to update doctor profile data from doctor panel
const updateDoctorProfile = async (req, resp) => {
    try {
        const { docId, fees, address, available } = req.body;
        await doctorModel_1.default.findByIdAndUpdate(docId, { fees, address, available });
        resp.json({
            success: true,
            message: "Profile updated"
        });
    }
    catch (error) {
        console.log(error);
        resp.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.updateDoctorProfile = updateDoctorProfile;
// export default {changeAvailability , doctorList};
