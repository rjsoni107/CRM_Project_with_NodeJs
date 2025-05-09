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

const PORT = process.env.PORT || 3005; // Default to 3005 if PORT is not set
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// MongoDB Connection
const MONGO_SERVER = process.env.MONGO_SERVER;
mongoose.connect(MONGO_SERVER)
    .then(() => {
        console.log("MongoDB Connected");
        createDefaultAdmin();
    })
    .catch(err => console.log("MongoDB Connection Error:", err));

// Export app for Vercel
module.exports = app;
