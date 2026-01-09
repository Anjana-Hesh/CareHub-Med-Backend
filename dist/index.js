"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const mongodb_1 = __importDefault(require("./config/mongodb"));
const cloudinary_1 = __importDefault(require("./config/cloudinary"));
const addminRoute_1 = __importDefault(require("./routes/addminRoute"));
const doctorRoute_1 = __importDefault(require("./routes/doctorRoute"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
// app config
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
(0, mongodb_1.default)();
(0, cloudinary_1.default)();
// middlewares
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// api endpoints
app.use('/api/v1/admin', addminRoute_1.default); // localhost:5000/api/v1/addmin/add-doctor
app.use('/api/v1/doctor', doctorRoute_1.default);
app.use('/api/v1/user', userRoute_1.default);
app.listen(port, () => console.log("Server started", port));
