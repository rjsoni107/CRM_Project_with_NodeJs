const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const { createDefaultAdmin } = require("./controllers/mainController");

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Middleware
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

// Routes
app.use("/crm", userRoutes);

// MongoDB Connection
const MONGO_SERVER = process.env.MONGO_SERVER
    .replace("<username>", process.env.MONGO_USER)
    .replace("<password>", process.env.MONGO_PASSWORD);
mongoose.connect(MONGO_SERVER, { dbName: process.env.DB_NAME })
    .then(() => {
        console.log("MongoDB Connected");
        createDefaultAdmin();
    })
    .catch(err => console.log("MongoDB Connection Error:", err));

// Export app for Vercel
module.exports = app;
