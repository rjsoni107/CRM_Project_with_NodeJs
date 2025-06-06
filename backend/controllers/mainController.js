const User = require("../modules/userModelMongo");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { userPermissions } = require("../util/Base");
const crypto = require("crypto");
const { timeLog } = require('../util/logger');
// const { notifyUser } = require('../util/websocket');
const LoginOTP = require("../modules/loginOtpModel");
const ForgotPIN = require("../modules/forgotPinModel");
const getUserDetailsFromToken = require("../helpers/getUserDetailsFromToken");

// Utility function to generate unique username based on name and mobile
const generateUniqueUsername = async (name, mobile) => {
    // Clean the name: remove spaces, convert to lowercase
    let baseName = name.toLowerCase().replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric chars
    if (baseName.length < 2) {
        baseName = 'user'; // Fallback if name is too short
    }
    // Take last 4 digits of mobile for uniqueness
    const mobileSuffix = mobile.slice(-4);
    let username = `${baseName}${mobileSuffix}`.slice(0, 20); // Ensure max length 20

    // Check if username exists
    let existingUser = await User.findOne({ userName: username });
    let attempt = 1;

    // If username exists, append a number until unique
    while (existingUser) {
        const suffix = `_${attempt}`;
        username = `${baseName}${mobileSuffix}${suffix}`.slice(0, 20);
        existingUser = await User.findOne({ userName: username });
        attempt++;
    }

    return username;
};

// Generate Unique ID- This function generates a unique 16-digit ID for the user.
function generateUniqueId() {
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
}

// Create Default Admin
exports.createDefaultAdmin = async () => {
    try {
        timeLog("[createDefaultAdmin] Checking if default admin exists...");
        const existingAdmin = await User.findOne({ userType: "ADMIN" });

        if (existingAdmin) {
            timeLog("[createDefaultAdmin] Default admin already exists.");
            return;
        }

        timeLog("[createDefaultAdmin] Creating default admin...");
        const hashedPin = await bcrypt.hash("111111", 10);
        await User.create({
            userId: generateUniqueId(),
            name: "Admin",
            status: "Active",
            userName: "admin",
            emailId: "admin@example.com",
            mobile: "1111111111",
            pin: hashedPin,
            userType: "ADMIN",
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        });

        timeLog("[createDefaultAdmin] Default admin created successfully.");
    } catch (error) {
        console.error("[createDefaultAdmin] Error creating default admin:", error.message);
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        timeLog("[loginUser] Login request received:", req.body);
        const { userName, pin, type, otp } = req.body;

        // Validate input
        if (!userName || (!pin && type !== 'loginOTP') || (type === 'loginOTP' && !otp)) {
            timeLog("[loginUser] Missing required fields.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Missing required fields",
                responseCode: "400",
            });
        }

        timeLog("[loginUser] Finding user by userName or mobile");
        // Search user by userName, mobile
        const user = await User.findOne({
            $or: [{ userName: userName }, { mobile: userName }]
        });
        const isNotActive = await User.findOne({
            $or: [{ userName: userName }, { mobile: userName }],
            status: "Active"
        });

        if (!user) {
            timeLog("[loginUser] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        if (!isNotActive) {
            timeLog("[loginUser] User is not active.");
            return res.status(403).json({
                responseStatus: "FAILED",
                responseMsg: "User not active",
                responseCode: "403",
            });
        }

        if (type === 'loginOTP') {
            timeLog("[loginUser] Validating OTP...");
            const loginOtp = await LoginOTP.findOne({ mobile: user.mobile, otp, status: "active" });

            if (!loginOtp) {
                timeLog("[loginUser] Invalid or expired OTP.");
                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "Invalid or expired OTP",
                    responseCode: "401",
                });
            }

            if (loginOtp.otpExpiry < Date.now()) {
                timeLog("[loginUser] OTP has expired.");
                loginOtp.status = "expired";
                await loginOtp.save();

                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "OTP has expired",
                    responseCode: "401",
                });
            }

            timeLog("[loginUser] OTP verified successfully.");
            loginOtp.status = "verified";
            await loginOtp.save();
        } else {
            timeLog("[loginUser] Validating PIN...");
            if (!user.pin) {
                timeLog("[loginUser] User PIN is not set.");
                return res.status(400).json({
                    responseStatus: "FAILED",
                    responseMsg: "User PIN is not set",
                    responseCode: "400",
                });
            }

            const isMatchPin = await bcrypt.compare(pin, user.pin);
            if (!isMatchPin) {
                timeLog("[loginUser] Invalid credentials.");
                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "Invalid credentials",
                    responseCode: "401",
                });
            }
        }

        timeLog("[loginUser] Generating JWT token...");
        const token = jwt.sign(
            { userId: user.userId, userType: user.userType, id: user._id, },
            process.env.JWT_SECRET,
            { algorithm: "HS256", expiresIn: "1h" }
        );

        const permissions = userPermissions[user.userType] || [];

        timeLog("[loginUser] Login successful.");
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "Login successful",
            responseCode: "200",
            token,
            userDetails: {
                userId: user.userId,
                name: user.name,
                mobile: user.mobile,
                userName: user.userName,
                userType: user.userType,
                permissions,
            },
        });
    } catch (error) {
        console.error("[loginUser] Error logging in:", error.message);
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error logging in: " + error.message,
            responseCode: "500",
        });
    }
};

// Add User
exports.signup = async (req, res) => {
    try {
        timeLog("[signup] Signup request received:", req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            timeLog("[signup] Validation errors:", errors.array());
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Validation errors",
                responseCode: "400",
                errors: errors.array(),
            });
        }

        const { name, mobile, pin, confirmPin, ...rest } = req.body;

        timeLog("[signup] Checking for duplicate mobile...");
        const existingUser = await User.findOne({ mobile });

        if (existingUser) {
            timeLog("[signup] Duplicate entry detected.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile Number already exists",
                responseCode: "400",
            });
        }

        if (pin !== confirmPin) {
            timeLog("[signup] PIN and Confirm PIN do not match.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Pin and Confirm Pin do not match",
                responseCode: "400",
            });
        }

        timeLog("[signup] Generating unique username...");
        const userName = await generateUniqueUsername(name, mobile);

        timeLog("[signup] Hashing PIN...");
        const hashedPin = await bcrypt.hash(pin, 10);

        timeLog("[signup] Creating new account...");

        const newUser = await User.create({
            ...req.body,
            userId: generateUniqueId(),
            userName,
            mobile,
            pin: hashedPin,
            userType: 'USER',
            status: 'InActive',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        });

        timeLog("[signup] Account created successfully.");
        res.status(201).json({
            responseStatus: "SUCCESS",
            responseMsg: `Congratulations! your account has been created successfully🎉 
            Your username is: ${newUser.userName}`,
            responseCode: "201",
            data: {
                userId: newUser.userId,
                userName: newUser.userName,
                userType: newUser.userType,
                mobile: newUser.mobile,
                created: newUser.created,
                updated: newUser.updated,
            },
        });
    } catch (error) {
        console.error("[signup] Error creating account:", error.message);
        if (error.code === 11000) {
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Duplicate userName or mobile number",
                responseCode: "400",
            });
        }
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error creating account: " + error.message,
            responseCode: "500",
        });
    }
};

// Add User
exports.addUser = async (req, res) => {
    try {
        timeLog("[addUser] Add user request received:");
        timeLog(JSON.stringify(req.body));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            timeLog("[addUser] Validation errors:", errors.array());
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Validation errors",
                responseCode: "400",
                errors: errors.array(),
            });
        }

        const { emailId, mobile, pin, confirmPin } = req.body;

        timeLog("[addUser] Checking for duplicate mobile...");
        const existingUser = await User.findOne({
            or: [{ emailId }, { mobile }]
        },
        );

        if (existingUser) {
            timeLog("[addUser] Duplicate entry detected.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Duplicate entry detected: Email or Mobile already exists",
                responseCode: "400",
            });
        }

        if (pin !== confirmPin) {
            timeLog("[addUser] PIN and Confirm PIN do not match.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Pin and Confirm Pin do not match",
                responseCode: "400",
            });
        }

        timeLog("[addUser] Hashing PIN...");
        const hashedPin = await bcrypt.hash(pin, 10);

        timeLog("[addUser] Creating new user...");
        const newUser = await User.create({
            ...req.body,
            userId: generateUniqueId(),
            emailId,
            mobile,
            pin: hashedPin,
            userType: "USER",
            status: "InActive",
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        });

        await db.collection("users").add(newUser);

        timeLog("[addUser] User added successfully.");
        res.status(201).json({
            responseStatus: "SUCCESS",
            responseMsg: "User added successfully",
            responseCode: "201",
            user: {
                userId: newUser.userId,
                userType: newUser.userType,
                emailId: newUser.emailId,
                mobile: newUser.mobile,
                created: newUser.created,
                updated: newUser.updated,
            },
        });
    } catch (error) {
        console.error("[addUser] Error adding user:", error.message);
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error saving user: " + error.message,
            responseCode: "500",
        });
    }
};

// Fetch All Users
exports.fetchAllUsers = async (req, res) => {
    timeLog("[fetchAllUsers] Fetching users...");
    try {
        const filters = {};

        // Dynamically build the filters object based on the request payload
        timeLog("[fetchAllUsers] Building filters object...");
        for (const [key, value] of Object.entries(req.body)) {
            if (value && value !== "All" && key !== "start" && key !== "length") {
                filters[key] = value;
            }
        }
        timeLog("[fetchAllUsers] Filters object:", filters);

        // Extract pagination parameters
        const start = parseInt(req.body.start) || 0; // Default to 0 if not provided
        const length = parseInt(req.body.length) || 10; // Default to 10 if not provided
        timeLog("[fetchAllUsers] Pagination parameters - Start:", start, "Length:", length);

        // Add a filter to only fetch users with userType = 'USER'
        filters.userType = 'USER';

        // Exclude the current user (req.user.userId)
        if (req.user && req.user.userId) {
            filters.userId = { $ne: req.user.userId };
            timeLog(`[fetchAllUsers] Excluding current user with userId: ${req.user.userId}`);
        } else {
            timeLog("[fetchAllUsers] No current user found in req.user");
        }

        timeLog("[fetchAllUsers] Fetching users from MongoDB...");
        const users = await User.find(filters)
            .skip(start)
            .limit(length)
        // .lean();

        const count = await User.countDocuments(filters);

        timeLog("[fetchAllUsers] Users fetched successfully. Count:", count);
        res.json({
            responseStatus: "SUCCESS",
            responseMsg: "Users fetched successfully",
            responseCode: "200",
            userList: users.map(user => ({
                userId: user.userId,
                userName: user.userName,
                name: user.name,
                emailId: user.emailId,
                mobile: user.mobile,
                userType: user.userType,
                status: user.status,
            })),
            countPerPage: count, // Total number of users matching the query
        });
    } catch (error) {
        console.error("[fetchAllUsers] Error fetching users:", error.message);
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error fetching users: " + error.message,
            responseCode: "500",
        });
    }
};

// Fetch User by Key
exports.fetchUserByKey = async (req, res) => {
    timeLog("[fetchUserByKey] Fetching user by key...");
    try {
        const { userId, emailId, mobile } = req.body;
        timeLog("[fetchUserByKey] Request body:", req.body);

        const query = {};
        if (userId) query.userId = userId;
        if (emailId) query.emailId = emailId;
        if (mobile) query.mobile = mobile;
        timeLog("[fetchUserByKey] Query object:", query);

        // Search for the user
        timeLog("[fetchUserByKey] Searching for user...");
        const user = await User.findOne(query);
        timeLog("[fetchUserByKey] User found:", user);

        if (user) {
            res.json({
                responseStatus: "SUCCESS",
                responseMsg: "User fetched successfully",
                responseCode: "200",
                user,
            });
        } else {
            timeLog("[fetchUserByKey] User not found.");
            res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found!",
                responseCode: "404",
            });
        }
    } catch (error) {
        console.error("[fetchUserByKey] Error fetching user:", error.message);
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error fetching user: " + error.message,
            responseCode: "500",
        });
    }
};

// Update User by ID
exports.updateUser = async (req, res) => {
    timeLog("[updateUser] Updating user...");
    try {
        const userId = req.body.userId; // Extract the `userId` field from the request body
        timeLog("[updateUser] User ID:", userId);

        // Validate the `id` field
        if (!userId) {
            timeLog("[updateUser] User ID is missing.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "User ID is required",
                responseCode: "400",
            });
        }

        const updatedData = req.body; // Extract the updated data from the request body
        timeLog("[updateUser] Updated data:", updatedData);

        // Update the user in the database
        timeLog("[updateUser] Updating user in database...");
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            updatedData,
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            timeLog("[updateUser] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        timeLog("[updateUser] User updated successfully.");
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "User updated successfully",
            responseCode: "200",
            updatedUser: { userId: userId, ...updatedData }, // Return the updated user
        });
    } catch (error) {
        console.error("[updateUser] Error updating user:", error.message);
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error updating user: " + error.message,
            responseCode: "500",
        });
    }
};

// Delete User by ID
exports.deleteUser = async (req, res) => {
    timeLog("[deleteUser] Deleting user...");
    try {
        const userId = req.params.userId; // Extract the user ID from the request parameters
        timeLog("[deleteUser] User ID:", userId);

        // Validate the user ID
        if (!userId) {
            timeLog("[deleteUser] User ID is missing.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "User ID is required",
                responseCode: "400",
            });
        }

        const user = await User.deleteOne({ userId });
        if (user.deletedCount === 0) {
            timeLog("[deleteUser] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        timeLog("[deleteUser] User deleted successfully.");
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "User deleted successfully",
            responseCode: "200",
        });

    } catch (error) {
        console.error("[deleteUser] Error deleting user:", error.message);
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error deleting user: " + error.message,
            responseCode: "500",
        });
    }
};

// Generate OTP
exports.generateOtp = async (req, res) => {
    try {
        timeLog("[generateOtp] Request received:", req.body);
        const { userName, type } = req.body;

        // Validate userName
        if (!userName) {
            timeLog("[generateOtp] userName is missing.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "userName is required",
                responseCode: "400",
            });
        }

        const userNameRegex = /^(?:[0-9]{10}|[a-zA-Z0-9._-]{6,20})$/;
        if (!userNameRegex.test(userName)) {
            timeLog("[generateOtp] Invalid userName format.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Invalid userName, must be a 10-digit mobile number or username (6-20 alphanumeric characters with underscores or hyphens)",
                responseCode: "400",
            });
        }

        timeLog("[generateOtp] Finding user by userName or mobile...");
        const user = await User.findOne({
            $or: [
                { userName: userName },
                { mobile: userName }
            ]
        });

        if (!user) {
            timeLog("[generateOtp] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        if (user.status !== "Active") {
            timeLog("[generateOtp] User is not active.");
            return res.status(403).json({
                responseStatus: "FAILED",
                responseMsg: "User not active",
                responseCode: "403",
            });
        }

        // Extract mobile number from user
        const mobile = user.mobile;

        // Generate a 6-digit OTP
        timeLog("[generateOtp] Generating OTP...");
        const otp = crypto.randomInt(100000, 999999).toString();

        // Save OTP in the database
        timeLog("[generateOtp] Marking existing OTPs as inactive...");
        const collectionName = type === 'loginOTP' ? LoginOTP : ForgotPIN;

        await collectionName.updateMany(
            { mobile, status: "active" },
            { $set: { status: "inActive" } }
        );

        timeLog("[generateOtp] Saving new OTP...");
        const newOtpEntry = new collectionName({
            mobile,
            otp,
            otpExpiry: Date.now() + 5 * 60 * 1000, // 5 minutes expiry
            status: "active",
            created: new Date().toISOString(),
        });
        await newOtpEntry.save();

        const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;

        timeLog(`[generateOtp] OTP for ${formattedMobile}: ${otp}`);

        res.status(200).json({
            type,
            mobile,
            responseStatus: "SUCCESS",
            responseMsg: "OTP sent successfully",
            responseCode: "200",
        });
    } catch (error) {
        console.error("[generateOtp] Error generating OTP:", error.message);
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error generating OTP: " + error.message,
            responseCode: "500",
        });
    }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    try {
        timeLog("[verifyOtp] Request received:", req.body);
        const { mobile, otp } = req.body;

        // Validate input
        if (!mobile || !otp) {
            timeLog("[verifyOtp] Mobile number or OTP is missing.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile number and OTP are required",
                responseCode: "400",
            });
        }

        // Find the user by mobile
        timeLog("[verifyOtp] Finding user by mobile...");
        const user = await User.findOne({ mobile });
        if (!user) {
            timeLog("[verifyOtp] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        if (user.status !== "Active") {
            timeLog("[verifyOtp] User is not active.");
            return res.status(403).json({
                responseStatus: "FAILED",
                responseMsg: "User not active",
                responseCode: "403",
            });
        }

        // Find the active OTP for the mobile
        timeLog("[verifyOtp] Finding active OTP...");
        const forgotPIN = await ForgotPIN.findOne({ mobile, otp, status: "active" });

        if (!forgotPIN) {
            timeLog("[verifyOtp] Invalid or expired OTP.");
            return res.status(401).json({
                responseStatus: "FAILED",
                responseMsg: "Invalid or expired OTP",
                responseCode: "401",
            });
        }

        // Check if OTP is expired
        if (forgotPIN.otpExpiry < Date.now()) {
            timeLog("[verifyOtp] OTP has expired.");
            // Mark the OTP as expired
            forgotPIN.status = "expired";
            await forgotPIN.save();

            return res.status(401).json({
                responseStatus: "FAILED",
                responseMsg: "OTP has expired",
                responseCode: "401",
            });
        }

        // Clear OTP after successful verification
        timeLog("[verifyOtp] Marking OTP as verified...");
        forgotPIN.status = "verified";
        await forgotPIN.save();

        // Generate JWT token
        timeLog("[verifyOtp] Generating JWT token...");
        const token = jwt.sign(
            { id: user.id, userType: user.userType }, // Payload
            process.env.JWT_SECRET, // Secret key
            { algorithm: "HS256", expiresIn: "1h" } // Token expiration time
        );

        timeLog("[verifyOtp] OTP verified successfully.");
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "OTP verified successfully",
            responseCode: "200",
            token,
            userDetails: {
                id: user.id,
                mobile: user.mobile,
                userType: user.userType,
            },
        });
    } catch (error) {
        console.error("[verifyOtp] Error verifying OTP:", error.message);
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error verifying OTP: " + error.message,
            responseCode: "500",
        });
    }
};

// Change User PIN
exports.changePin = async (req, res) => {
    try {
        timeLog("[changePin] Request received:", req.body);
        const { mobile, pin, confirmPin } = req.body;

        // Find the user by mobile
        timeLog("[changePin] Finding user by mobile...");
        const user = await User.findOne({ mobile });

        if (!user) {
            timeLog("[changePin] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        // Validate the new PIN and confirm PIN
        if (pin !== confirmPin) {
            timeLog("[changePin] New PIN and Confirm PIN do not match.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "New PIN and Confirm PIN do not match",
                responseCode: "400",
            });
        }

        timeLog("[changePin] Checking if new PIN is the same as the old PIN...");
        const isSamePin = await bcrypt.compare(pin, user.pin);

        if (isSamePin) {
            timeLog("[changePin] New PIN cannot be the same as the old PIN.");
            return res.status(402).json({
                responseStatus: "FAILED",
                responseMsg: "New PIN cannot be same as old PIN",
                responseCode: "402",
            });
        }

        // Hash the new PIN
        timeLog("[changePin] Hashing new PIN...");
        const hashedPin = await bcrypt.hash(pin, 10);

        // Update the user's PIN
        timeLog("[changePin] Updating user's PIN...");
        user.pin = hashedPin;
        await user.save();

        timeLog("[changePin] PIN updated successfully.");
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "PIN updated successfully",
            responseCode: "200",
        });
    } catch (error) {
        console.error("[changePin] Error updating PIN:", error.message);
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error updating PIN: " + error.message,
            responseCode: "500",
        });
    }
};

// Fetch chat messages
exports.fetchChatMessages = async (req, res) => {
    try {
        timeLog("[fetchChatMessages] Request received:", req.body);
        const chatId = req.body.chatId;
        timeLog("[fetchChatMessages] Chat ID:", chatId);
        // Validate input
        if (!chatId) {
            timeLog("[fetchChatMessages] Chat ID is missing.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Chat ID is required",
                responseCode: "400",
            });
        }

        // Fetch chat messages from Firestore
        timeLog("[fetchChatMessages] Fetching chat messages...");
        const chatQuery = db.collection("chats")
            .where("chatId", "==", chatId)
            .orderBy("timestamp", "asc");
        const chatSnapshot = await chatQuery.get();

        if (chatSnapshot.empty) {
            timeLog("[fetchChatMessages] No messages found for this chat.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "No messages found for this chat",
                responseCode: "404",
            });
        }

        const messages = chatSnapshot.docs.map(doc => doc.data());

        timeLog("[fetchChatMessages] Chat messages fetched successfully.");
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "Chat messages fetched successfully",
            responseCode: "200",
            chats: messages,
        });
    } catch (error) {
        console.error("[fetchChatMessages] Error fetching chat messages:", error.message);
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error fetching chat messages: " + error.message,
            responseCode: "500",
        });
    }
};

// Send a chat message
exports.sendChatMessage = async (req, res) => {
    try {
        timeLog("[sendChatMessage] Request received:", req.body);
        const { chatId, senderId, receiverId, message } = req.body;

        // Validate input
        if (!chatId || !senderId || !receiverId || !message) {
            timeLog("[sendChatMessage] Missing required fields.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Chat ID, sender ID, receiver ID, and message are required",
                responseCode: "400",
            });
        }

        if (message.length > 1000) {
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Message too long (max 1000 characters)",
                responseCode: "400",
            });
        }

        const receiverQuery = db.collection("users").where("userId", "==", receiverId);
        const receiverSnapshot = await receiverQuery.get();
        if (receiverSnapshot.empty) {
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "Receiver not found",
                responseCode: "404",
            });
        }

        // Create a new chat message object
        const newMessage = {
            chatId,
            senderId,
            receiverId,
            message,
            timestamp: new Date().toISOString(),
            deliveredTo: [senderId],
            readBy: [],
        };

        // Save the chat message to Firestore
        timeLog("[sendChatMessage] Saving chat message...");
        const chatRef = await db.collection("chats").add(newMessage);

        // Notify the receiver about the new message
        notifyUser(receiverId, { message: `New message from ${senderId} in chat ${chatId}`, chatId, senderId });

        timeLog("[sendChatMessage] Chat message sent successfully.");
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "Message sent successfully",
            responseCode: "200",
            chatId: chatRef.id
        });
    } catch (error) {
        console.error("[sendChatMessage] Error sending chat message:", error.message);
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error sending chat message: " + error.message,
            responseCode: "500",
        });
    }
};

exports.fetchNotifications = async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    try {
        const notificationsSnapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .where('status', '==', 'unread')
            .get();
        const notifications = notificationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.status(200).json({ notifications });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

exports.markReadNotifications = async (req, res) => {
    const { id } = req.params;
    try {
        await db.collection('notifications').doc(id).update({ status: 'read' });
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

exports.fetchActiveFriendsList = async (req, res) => {
    timeLog("[fetchActiveFriendsList] Fetching friendsList...");
    try {
        const filters = {};
        // Dynamically build the filters object based on the request payload
        timeLog("[fetchActiveFriendsList] Building filters object...");
        for (const [key, value] of Object.entries(req.body)) {
            if (value && value !== "All") {
                filters[key] = value;
            }
        }
        timeLog("[fetchActiveFriendsList] Filters object:", filters);
        // Add a filter to only fetch users with userType = 'USER'
        filters.userType = 'USER';
        // Build Firestore query
        timeLog("[fetchActiveFriendsList] Building Firestore query...");
        let userQuery = db.collection("users");
        for (const [key, value] of Object.entries(filters)) {
            userQuery = userQuery.where(key, "==", value);
        }

        const friendsSnapshot = await userQuery
            .where('userId', '!=', req.user.userId)
            .where('userType', '==', 'USER')
            .where('status', '==', 'Active')
            .get();
        const friends = friendsSnapshot.docs.map(doc => ({
            userId: doc.userId,
            ...doc.data(),
        }));
        if (friends.length === 0) {
            timeLog("[fetchAllUsers] No friends found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "No friends found",
                responseCode: "404",
            });
        }
        timeLog("[fetchAllUsers] Users fetched successfully. friends:", friends.length);
        res.json({
            responseStatus: "SUCCESS",
            responseMsg: "Friends fetched successfully",
            responseCode: "200",
            friendsList: friends.map(friend => ({
                userId: friend.userId,
                name: friend.name,
                emailId: friend.emailId,
                mobile: friend.mobile,
                lastSeen: friend.lastSeen,
            })),
        });
    } catch (err) {
        console.error('Error fetching friends list:', err);
        res.status(500).json({ error: 'Failed to fetch friends list' });
    }
};

exports.getUserProfileDetails = async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader?.split(" ")[1];

        const user = await getUserDetailsFromToken(token)

        return res.status(200).json({
            message: "user details",
            data: user
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true
        })
    }
}

exports.searchUserList = async (req, res) => {
    try {
        const { search } = req.body;
        const currentUserId = req.user?.userId;
        const query = new RegExp(search, "i");

        const users = await User.find({
            userType: "USER",
            status: "Active",
            userId: { $ne: currentUserId },
            $or: [{ name: query }, { mobile: query }]
        }).select("-password");

        return res.json({
            responseStatus: "SUCCESS",
            responseMsg: "Users fetched successfully",
            responseCode: "200",
            data: users,
            success: true
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true
        });
    }
}