// const app = require("./app");
// require("dotenv").config();
// const { PORT, SERVER } = process.env;

// app.listen(PORT, () => {
//     console.log(`Server is running on ${SERVER || "http://localhost:"}${PORT || 3005}`);
// });


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
// const { createDefaultAdmin } = require("./controllers/mainControllerSQL");
// const sequelize = require("./config/postgresDatabase");

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

// (async () => {
//     try {
//         await sequelize.authenticate(); // Test PostgreSQL connection.
//         console.log('PostgreSQL connected!');

//         await sequelize.sync({ alter: true }); // Sync models with the database
//         console.log('PostgreSQL database synced!');
//     } catch (error) {
//         console.error('Unable to connect to PostgreSQL:', error.message);
//     }
// })();

// Export app for Vercel
module.exports = app;