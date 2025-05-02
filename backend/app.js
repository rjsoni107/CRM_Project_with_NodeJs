const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const { createDefaultAdmin } = require("./controllers/mainController");
const sequelize = require("./config/postgresDatabase");

const app = express();
app.use(express.json());

// Middleware
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);
    next();
});

// Routes
app.use("/crm/", userRoutes);

// MongoDB Connection
const { MONGO_SERVER, DB_NAME } = process.env;
mongoose.connect(`${MONGO_SERVER}${DB_NAME}`)
    .then(() => {
        console.log("MongoDB connected!");
    })
    .catch(err => console.log("MongoDB connection error:", err));

(async () => {
    try {
        await sequelize.authenticate(); // Test PostgreSQL connection.
        console.log('PostgreSQL connected!');

        await sequelize.sync({ alter: true }); // Sync models with the database
        console.log('PostgreSQL database synced!');
        createDefaultAdmin(); // Create default admin in MySQL
    } catch (error) {
        console.error('Unable to connect to PostgreSQL:', error.message);
    }
})();

module.exports = app;