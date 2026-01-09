"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const doctorController_1 = require("../controllers/doctorController");
const authDoctor_1 = __importDefault(require("../middlewares/authDoctor"));
const doctorRouter = express_1.default.Router();
doctorRouter.get('/list', doctorController_1.doctorList);
doctorRouter.post('/login', doctorController_1.loginDoctor);
doctorRouter.get('/appointments', authDoctor_1.default, doctorController_1.appointmentDoctor);
doctorRouter.post('/complete-appointment', authDoctor_1.default, doctorController_1.appointmentComplete);
doctorRouter.post('/cancel-appointment', authDoctor_1.default, doctorController_1.appointmentCancel);
doctorRouter.get('/dashboard', authDoctor_1.default, doctorController_1.doctorDashboard);
doctorRouter.get('/profile', authDoctor_1.default, doctorController_1.doctorProfile);
doctorRouter.post('/update-profile', authDoctor_1.default, doctorController_1.updateDoctorProfile);
exports.default = doctorRouter;
