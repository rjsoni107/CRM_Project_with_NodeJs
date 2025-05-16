const db = require('../firebase');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { userPermissions } = require("../util/Base");
const crypto = require("crypto");
const { timeLog } = require('../util/logger');
const { notifyUser } = require('../util/websocket');

// Generate Unique ID- This function generates a unique 16-digit ID for the user.
function generateUniqueId() {
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
}

// Create Default Admin
exports.createDefaultAdmin = async () => {
    try {
        timeLog("[createDefaultAdmin] Checking if default admin exists...");
        // Use db.collection() instead of collection()
        const adminQuery = db.collection("users").where("userType", "==", "ADMIN");
        const adminSnapshot = await adminQuery.get();

        if (!adminSnapshot.empty) {
            timeLog("[createDefaultAdmin] Default admin already exists.");
            return;
        }

        timeLog("[createDefaultAdmin] Creating default admin...");
        const hashedPin = await bcrypt.hash("111111", 10);
        const userRef = db.collection("users").doc();
        await userRef.set({
            userId: userRef.id,
            firstName: "Default",
            lastName: "Admin",
            emailId: "admin@example.com",
            mobile: "1111111111",
            pin: hashedPin,
            userType: "ADMIN",
            status: "Active",
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
        const { mobile, pin, type, otp } = req.body;

        timeLog("[loginUser] Finding user by mobile...");
        const userQuery = db.collection("users").where("mobile", "==", mobile);
        const userSnapshot = await userQuery.get();

        if (userSnapshot.empty) {
            timeLog("[loginUser] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        if (userSnapshot.size > 1) {
            timeLog("[loginUser] Multiple users found with the same mobile number.");
            return res.status(500).json({
                responseStatus: "FAILED",
                responseMsg: "Internal server error: Duplicate mobile number",
                responseCode: "500",
            });
        }

        const user = userSnapshot.docs[0].data();

        if (user.status !== "Active") {
            timeLog("[loginUser] User is not active.");
            return res.status(403).json({
                responseStatus: "FAILED",
                responseMsg: "User not active",
                responseCode: "403",
            });
        }

        if (type === 'loginOTP') {
            timeLog("[loginUser] Validating OTP...");
            const otpQuery = db.collection("loginOtps")
                .where("mobile", "==", mobile)
                .where("otp", "==", otp)
                .where("status", "==", "active");
            const otpSnapshot = await otpQuery.get();

            if (otpSnapshot.empty) {
                timeLog("[loginUser] Invalid or expired OTP.");
                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "Invalid or expired OTP",
                    responseCode: "401",
                });
            }

            const otpDoc = otpSnapshot.docs[0];
            const otpData = otpDoc.data();

            if (otpData.otpExpiry < Date.now()) {
                timeLog("[loginUser] OTP has expired.");
                await db.collection("loginOtps").doc(otpDoc.id).update({ status: "expired" });

                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "OTP has expired",
                    responseCode: "401",
                });
            }

            timeLog("[loginUser] OTP verified successfully.");
            await db.collection("loginOtps").doc(otpDoc.id).update({ status: "verified" });
        } else {
            timeLog("[loginUser] Validating PIN...");
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
            { userId: user.userId, userType: user.userType },
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
                name: `${user.firstName} ${user.lastName || ''}`,
                emailId: user.emailId,
                mobile: user.mobile,
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

        const { emailId, mobile, pin, confirmPin, ...rest } = req.body;

        timeLog("[signup] Checking for duplicate mobile...");
        const mobileQuery = db.collection("users").where("mobile", "==", mobile);
        const mobileSnapshot = await mobileQuery.get();

        if (!mobileSnapshot.empty) {
            timeLog("[signup] Duplicate mobile detected.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile already exists",
                responseCode: "400",
            });
        }

        if (emailId && emailId.trim() !== "") {
            timeLog("[addUser] Checking for duplicate email...");
            const emailQuery = db.collection("users").where("emailId", "==", emailId);
            const emailSnapshot = await emailQuery.get();

            if (!emailSnapshot.empty) {
                timeLog("[addUser] Duplicate email detected.");
                return res.status(400).json({
                    responseStatus: "FAILED",
                    responseMsg: "Email already exists",
                    responseCode: "400",
                });
            }
        }

        if (pin !== confirmPin) {
            timeLog("[signup] PIN and Confirm PIN do not match.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Pin and Confirm Pin do not match",
                responseCode: "400",
            });
        }

        timeLog("[signup] Hashing PIN...");
        const hashedPin = await bcrypt.hash(pin, 10);

        timeLog("[signup] Creating new account...");
        const newUser = {
            ...rest,
            id: generateUniqueId(),
            emailId,
            mobile,
            pin: hashedPin,
            userType: 'USER',
            status: 'Active',
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        };

        await db.collection("users").add(newUser);

        timeLog("[signup] Account created successfully.");
        res.status(201).json({
            responseStatus: "SUCCESS",
            responseMsg: "Congratulations! your account has been created successfully🎉",
            responseCode: "201",
            data: {
                userId: newUser.userId,
                userType: newUser.userType,
                emailId: newUser.emailId,
                mobile: newUser.mobile,
                created: newUser.created,
                updated: newUser.updated,
            },
        });
    } catch (error) {
        console.error("[signup] Error creating account:", error.message);
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

        const { emailId, mobile, pin, confirmPin, ...rest } = req.body;

        timeLog("[addUser] Checking for duplicate mobile...");
        const mobileQuery = db.collection("users").where("mobile", "==", mobile);
        const mobileSnapshot = await mobileQuery.get();

        if (!mobileSnapshot.empty) {
            timeLog("[addUser] Duplicate mobile detected.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile already exists",
                responseCode: "400",
            });
        }

        if (emailId && emailId.trim() !== "") {
            timeLog("[addUser] Checking for duplicate email...");
            const emailQuery = db.collection("users").where("emailId", "==", emailId);
            const emailSnapshot = await emailQuery.get();

            if (!emailSnapshot.empty) {
                timeLog("[addUser] Duplicate email detected.");
                return res.status(400).json({
                    responseStatus: "FAILED",
                    responseMsg: "Email already exists",
                    responseCode: "400",
                });
            }
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
        const newUser = {
            ...rest,
            id: generateUniqueId(),
            emailId,
            mobile,
            pin: hashedPin,
            userType: "USER",
            status: "Active",
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        };

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

        // Build Firestore query
        timeLog("[fetchAllUsers] Building Firestore query...");
        let userQuery = db.collection("users");
        for (const [key, value] of Object.entries(filters)) {
            userQuery = userQuery.where(key, "==", value);
        }

        timeLog("[fetchAllUsers] Fetching users from Firestore...");
        const userSnapshot = await userQuery.get();

        // Apply pagination manually
        const users = userSnapshot.docs.slice(start, start + length).map(doc => ({
            userId: doc.userId,
            ...doc.data(),
        }));

        const count = userSnapshot.size; // Total number of users matching the query

        timeLog("[fetchAllUsers] Users fetched successfully. Count:", count);
        res.json({
            responseStatus: "SUCCESS",
            responseMsg: "Users fetched successfully",
            responseCode: "200",
            userList: users.map(user => ({
                userId: user.userId,
                firstName: user.firstName,
                lastName: user.lastName,
                businessName: user.businessName,
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

        // Build Firestore query
        let userQuery = db.collection("users");
        if (userId) {
            userQuery = userQuery.where("userId", "==", userId);
        } else if (emailId) {
            userQuery = userQuery.where("emailId", "==", emailId);
        } else if (mobile) {
            userQuery = userQuery.where("mobile", "==", mobile);
        } else {
            timeLog("[fetchUserByKey] No valid key provided.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "At least one key (id, emailId, or mobile) is required",
                responseCode: "400",
            });
        }

        timeLog("[fetchUserByKey] Searching for user...");
        const userSnapshot = await userQuery.get();

        if (userSnapshot.empty) {
            timeLog("[fetchUserByKey] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found!",
                responseCode: "404",
            });
        }

        const user = userSnapshot.docs[0].data();
        timeLog("[fetchUserByKey] User found:", user);

        res.json({
            responseStatus: "SUCCESS",
            responseMsg: "User fetched successfully",
            responseCode: "200",
            user,
        });
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

        // Query Firestore to find the document with the matching `id` field
        timeLog("[updateUser] Searching for user in Firestore...");
        const userQuery = db.collection("users").where("userId", "==", userId);
        const userSnapshot = await userQuery.get();

        if (userSnapshot.empty) {
            timeLog("[updateUser] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        // Get the Firestore document ID
        const userDocId = userSnapshot.docs[0].id;

        // Update the user document in Firestore
        timeLog("[updateUser] Updating user in Firestore...");
        await db.collection("users").doc(userDocId).update(updatedData);

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

        // Reference to the user document in Firestore
        const userQuery = db.collection("users").where("userId", "==", userId);
        const userSnapshot = await userQuery.get();

        if (userSnapshot.empty) {
            timeLog("[deleteUser] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        // Get the document ID of the user
        const userDocId = userSnapshot.docs[0].id;

        // Delete the user document
        timeLog("[deleteUser] Deleting user from Firestore...");
        await db.collection("users").doc(userDocId).delete();

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
        const { mobile, type } = req.body;

        if (!mobile) {
            timeLog("[generateOtp] Mobile number is missing.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile number is required",
                responseCode: "400",
            });
        }

        timeLog("[generateOtp] Finding user by mobile...");
        const userQuery = db.collection("users").where("mobile", "==", mobile);
        const userSnapshot = await userQuery.get();

        if (userSnapshot.empty) {
            timeLog("[generateOtp] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        const user = userSnapshot.docs[0].data();

        if (user.status !== "Active") {
            timeLog("[generateOtp] User is not active.");
            return res.status(403).json({
                responseStatus: "FAILED",
                responseMsg: "User not active",
                responseCode: "403",
            });
        }

        // Generate a 6-digit OTP
        timeLog("[generateOtp] Generating OTP...");
        const otp = crypto.randomInt(100000, 999999).toString();

        // Save OTP in Firestore
        timeLog("[generateOtp] Marking existing OTPs as inactive...");
        const otpCollection = type === 'loginOTP' ? "loginOtps" : "forgotPins";

        const otpQuery = db.collection(otpCollection)
            .where("mobile", "==", mobile)
            .where("status", "==", "active");
        const otpSnapshot = await otpQuery.get();

        // Mark existing OTPs as inactive
        const batch = db.batch();
        otpSnapshot.forEach((doc) => {
            batch.update(doc.ref, { status: "inActive" });
        });
        await batch.commit();

        timeLog("[generateOtp] Saving new OTP...");
        await db.collection(otpCollection).add({
            mobile,
            otp,
            otpExpiry: Date.now() + 5 * 60 * 1000, // OTP valid for 5 minutes
            status: "active",
            created: new Date().toISOString(),
        });

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
        const userQuery = db.collection("users").where("mobile", "==", mobile);
        const userSnapshot = await userQuery.get();

        if (userSnapshot.empty) {
            timeLog("[verifyOtp] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        const user = userSnapshot.docs[0].data();

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
        const otpQuery = db.collection("forgotPins")
            .where("mobile", "==", mobile)
            .where("otp", "==", otp)
            .where("status", "==", "active");
        const otpSnapshot = await otpQuery.get();

        if (otpSnapshot.empty) {
            timeLog("[verifyOtp] Invalid or expired OTP.");
            return res.status(401).json({
                responseStatus: "FAILED",
                responseMsg: "Invalid or expired OTP",
                responseCode: "401",
            });
        }

        const otpDoc = otpSnapshot.docs[0];
        const otpData = otpDoc.data();

        // Check if OTP is expired
        if (otpData.otpExpiry < Date.now()) {
            timeLog("[verifyOtp] OTP has expired.");
            await db.collection("forgotPins").doc(otpDoc.id).update({ status: "expired" });

            return res.status(401).json({
                responseStatus: "FAILED",
                responseMsg: "OTP has expired",
                responseCode: "401",
            });
        }

        // Clear OTP after successful verification
        timeLog("[verifyOtp] Marking OTP as verified...");
        await db.collection("forgotPins").doc(otpDoc.id).update({ status: "verified" });

        // Generate JWT token
        timeLog("[verifyOtp] Generating JWT token...");
        const token = jwt.sign(
            { userId: user.userId, userType: user.userType }, // Payload
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
                userId: user.userId,
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

        // Validate input
        if (!mobile || !pin || !confirmPin) {
            timeLog("[changePin] Missing required fields.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile, PIN, and Confirm PIN are required",
                responseCode: "400",
            });
        }

        // Find the user by mobile
        timeLog("[changePin] Finding user by mobile...");
        const userQuery = db.collection("users").where("mobile", "==", mobile);
        const userSnapshot = await userQuery.get();

        if (userSnapshot.empty) {
            timeLog("[changePin] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        const userDoc = userSnapshot.docs[0];
        const user = userDoc.data();

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
                responseMsg: "New PIN cannot be the same as the old PIN",
                responseCode: "402",
            });
        }

        // Hash the new PIN
        timeLog("[changePin] Hashing new PIN...");
        const hashedPin = await bcrypt.hash(pin, 10);

        // Update the user's PIN in Firestore
        timeLog("[changePin] Updating user's PIN...");
        await db.collection("users").doc(userDoc.id).update({ pin: hashedPin });

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