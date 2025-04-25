const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const { createDefaultAdmin } = require("./controllers/mainController");

const app = express();
app.use(express.json());

// Middleware
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    next();
});

// Routes
app.use("/crm/", userRoutes);
const { MONGO_SERVER, DB_NAME } = process.env;

// MongoDB Connection
mongoose.connect(`${MONGO_SERVER}${DB_NAME}`)
    .then(() => {
        console.log("MongoDB connected!");
        createDefaultAdmin();
    })
    .catch(err => console.log("Connection error:", err));

module.exports = app;