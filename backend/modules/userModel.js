const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    id: String,
    firstName: String,
    lastName: String,
    emailId: String,
    pin: String,
    password: String,
    mobile: String,
    address: String,
    city: String,
    state: String,
    country: String,
    zip: String,
    company: String,
    website: String,
    status: String,
    userType: String,
    created: String,
    updated: String,
    token: String
}, { versionKey: false, collection: process.env.MONGO_DB_USERS });

const User = mongoose.model("User", userSchema);

module.exports = User;