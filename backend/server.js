const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const { createDefaultAdmin } = require("./controllers/mainController");
const dotenv = require("dotenv");
const { timeLog } = require('./util/logger');
const rateLimit = require('express-rate-limit');
const { default: mongoose } = require('mongoose');

dotenv.config();
const { FRONTEND_URL, } = process.env;

const app = express();

// Define allowed origins
const allowedOrigins = [
    FRONTEND_URL,
    'http://192.168.1.111:3006',
    'http://localhost:3006',
].filter(Boolean);

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use((req, res, next) => {
    next();
});

app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});

app.use('/api', limiter);

// Routes
app.use('/api', userRoutes);


const PORT = process.env.PORT || 3005; // Default to 3005 if PORT is not set
app.listen(PORT, () => {
    timeLog(`[server.listen] Server running on port ${PORT}`);
});

// MongoDB Connection
const MONGO_SERVER = process.env.MONGO_SERVER;
mongoose.connect(MONGO_SERVER)
    .then(() => {
        timeLog("MongoDB Connected");
        createDefaultAdmin();
    })
    .catch(err => timeLog("MongoDB Connection Error:", err));

// Export app for Vercel
module.exports = app;