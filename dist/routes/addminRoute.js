"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const multer_1 = __importDefault(require("../middlewares/multer"));
const authAdmin_1 = __importDefault(require("../middlewares/authAdmin"));
const doctorController_1 = require("../controllers/doctorController");
const addminRouter = express_1.default.Router();
addminRouter.post('/add-doctor', authAdmin_1.default, multer_1.default.single('image'), adminController_1.addDoctor);
// addminRouter.post('/login', loginAdmin)
addminRouter.post('/all-doctors', authAdmin_1.default, adminController_1.allDoctors);
addminRouter.post('/change-availability', authAdmin_1.default, doctorController_1.changeAvailability);
addminRouter.get('/appointments', authAdmin_1.default, adminController_1.appointmentAdmin);
addminRouter.post('/cancel-appointment', authAdmin_1.default, adminController_1.appointmentCancel);
addminRouter.get('/dashboard', authAdmin_1.default, adminController_1.adminDashboard);
exports.default = addminRouter;
