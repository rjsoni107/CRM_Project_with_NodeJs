const mongoose = require("mongoose");

const loginOtpSchema = new mongoose.Schema({
    id: String,
    otp: String,
    otpExpiry: String,
    mobile: String,
    userType: String,
    created: String,
    updated: String,
    status: { type: String, default: "active" },
    token: String
}, { versionKey: false, collection: process.env.MONGO_DB_LOGIN_OTP });

const LoginOTP = mongoose.model("LoginOTP", loginOtpSchema);

module.exports = LoginOTP;