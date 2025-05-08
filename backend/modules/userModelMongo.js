const mongoose = require("mongoose");

const UsersSchema = new mongoose.Schema({
    id: String,
    businessName: String,
    firstName: String,
    lastName: String,
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
    status: { type: String, default: "Active" },
    created: String,
    updated: String,
    token: String
}, { versionKey: false, collection: process.env.MONGO_DB_USERS });

const Users = mongoose.model("User", UsersSchema);

module.exports = Users;