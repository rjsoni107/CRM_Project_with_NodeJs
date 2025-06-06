const mongoose = require("mongoose");

const UsersSchema = new mongoose.Schema({
    userId: String,
    id: String,
    businessName: String,
    name: String,
    userName: String,
    emailId: String,
    mobile: String,
    pin: String,
    userType: String,
    address: String,
    city: String,
    state: String,
    country: String,
    zip: String,
    company: String,
    website: String,
    profile_pic: { type: String, default: "", trim: true },
    status: { type: String, default: "InActive" },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
    lastSeen: { type: Date },
    token: String
}, { versionKey: false, collection: process.env.MONGO_DB_USERS, timestamps: true });

// Add unique indexes for userName and mobile
UsersSchema.index({ userName: 1 }, { unique: true });
UsersSchema.index({ mobile: 1 }, { unique: true });

const Users = mongoose.model("User", UsersSchema);

module.exports = Users;