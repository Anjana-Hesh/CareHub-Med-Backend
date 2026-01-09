"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboard = exports.appointmentCancel = exports.appointmentAdmin = exports.allDoctors = exports.addDoctor = void 0;
const validator_1 = __importDefault(require("validator"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const cloudinary_1 = require("cloudinary");
const doctorModel_1 = __importDefault(require("../models/doctorModel"));
const appointmentModel_1 = __importDefault(require("../models/appointmentModel"));
const userModel_1 = require("../models/userModel");
// Api for adding doctor
const addDoctor = async (req, resp) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
        const imageFile = req.file;
        // console.log({name , email , password , speciality , degree , experience , about ,fees ,address} , imageFile)
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return resp.status(401).json({
                success: false,
                message: "Missing some details ..."
            });
        }
        // validating email
        if (!validator_1.default.isEmail(email)) {
            return resp.status(401).json({
                success: false,
                message: "Please Enter a valid email"
            });
        }
        // validating password
        if (password.length < 8) {
            return resp.status(401).json({
                success: false,
                message: "Please Enter a strong password"
            });
        }
        // validate is image exist
        if (!imageFile) {
            return resp.status(400).json({
                success: false,
                message: "Doctor image is required"
            });
        }
        // hashing doc password
        const salt = await bcrypt_1.default.genSalt(10); // increese security , genarating random salt with 10 rounds
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        // upload image to cloudinary
        const imageUpload = await cloudinary_1.v2.uploader.upload(imageFile.path, { resource_type: "image" });
        const imageUrl = imageUpload.secure_url;
        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now()
        };
        const newDoctor = new doctorModel_1.default(doctorData);
        await newDoctor.save();
        resp.status(201).json({
            success: true,
            message: "Doctor added successfully"
        });
    }
    catch (error) {
        console.log(error);
        resp.status(500).json({
            success: false,
            message: "Doctor adding error, ", error
        });
    }
};
exports.addDoctor = addDoctor;
const allDoctors = async (req, resp) => {
    try {
        const doctors = await doctorModel_1.default.find({}).select('-password'); // to removed password in response
        resp.json({
            success: true,
            doctors
        });
    }
    catch (error) {
        console.log(error);
        resp.status(500).json({
            success: false,
            message: "Doctor adding error, ", error
        });
    }
};
exports.allDoctors = allDoctors;
// API to get all appointmnet list
const appointmentAdmin = async (req, resp) => {
    try {
        const appointments = await (await appointmentModel_1.default.find({})).reverse();
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
exports.appointmentAdmin = appointmentAdmin;
// API for appointment cancelletion
const appointmentCancel = async (req, resp) => {
    try {
        const { appointmentId } = req.body;
        if (!appointmentId) {
            return resp.status(400).json({
                success: false,
                message: 'Appointment ID is required',
            });
        }
        const appointmentData = await appointmentModel_1.default.findById(appointmentId);
        if (!appointmentData) {
            return resp.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }
        await appointmentModel_1.default.findByIdAndUpdate(appointmentId, { cancelled: true });
        // releasing doctor slot
        const { docId, slotDate, slotTime } = appointmentData;
        const doctorData = await doctorModel_1.default.findById(docId);
        if (!doctorData) {
            return resp.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }
        // let slots_booked = doctorData.slots_booked
        // slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)
        const slots_booked = doctorData.slots_booked || {};
        if (slots_booked[slotDate]) {
            slots_booked[slotDate] = slots_booked[slotDate].filter((time) => time !== slotTime);
            // Cleanup empty date key
            if (slots_booked[slotDate].length === 0) {
                delete slots_booked[slotDate];
            }
        }
        await doctorModel_1.default.findByIdAndUpdate(docId, { slots_booked });
        resp.json({
            success: true,
            message: 'Appointment cancelled'
        });
    }
    catch (error) {
        console.error(error);
        resp.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.appointmentCancel = appointmentCancel;
// API to get dashboard data for admin panel
const adminDashboard = async (req, resp) => {
    try {
        const doctors = await doctorModel_1.default.find({});
        const users = await userModel_1.User.find({});
        const appointments = await appointmentModel_1.default.find({});
        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0, 5)
        };
        resp.json({
            success: true,
            dashData
        });
    }
    catch (error) {
        console.error(error);
        resp.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.adminDashboard = adminDashboard;
