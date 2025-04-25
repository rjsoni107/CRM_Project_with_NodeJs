const mongoose = require("mongoose");

const forgotPinSchema = new mongoose.Schema({
    id: String,
    otp: String,
    otpExpiry: String,
    mobile: String,
    userType: String,
    created: String,
    updated: String,
    status: { type: String, default: "active" },
    token: String
}, { versionKey: false, collection: process.env.MONGO_DB_FORGOT_PIN });

const ForgotPIN = mongoose.model("ForgotPIN", forgotPinSchema);

module.exports = ForgotPIN;