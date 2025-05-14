const { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch } = require('firebase/firestore');
const db = require('../db');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { userPermissions } = require("../util/Base");
const crypto = require("crypto");
// const ForgotPIN = require("../modules/forgotPinModel");
// const LoginOTP = require("../modules/loginOtpModel");

// Generate Unique ID
// This function generates a unique 16-digit ID for the user.
function generateUniqueId() {
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
}

const isValueExist = (data) => data !== null && data !== undefined && data !== 'null';

// Create Default Admin
exports.createDefaultAdmin = async () => {
    try {
        console.log("[createDefaultAdmin] Checking if default admin exists...");
        const adminQuery = query(collection(db, "users"), where("userType", "==", "ADMIN"));
        const adminSnapshot = await getDocs(adminQuery);

        if (!adminSnapshot.empty) {
            console.log("[createDefaultAdmin] Default admin already exists.");
            return;
        }

        console.log("[createDefaultAdmin] Creating default admin...");
        const hashedPin = await bcrypt.hash("111111", 10); // Default PIN (hashed)
        await addDoc(collection(db, "users"), {
            id: generateUniqueId(),
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

        console.log("[createDefaultAdmin] Default admin created successfully.");
    } catch (error) {
        console.error("[createDefaultAdmin] Error creating default admin:", error.message);
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        console.log("[loginUser] Login request received:", req.body);
        const { mobile, pin, type, otp } = req.body;

        console.log("[loginUser] Finding user by mobile...");
        const userQuery = query(collection(db, "users"), where("mobile", "==", mobile));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            console.log("[loginUser] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        const user = userSnapshot.docs[0].data();

        if (user.status !== "Active") {
            console.log("[loginUser] User is not active.");
            return res.status(403).json({
                responseStatus: "FAILED",
                responseMsg: "User not active",
                responseCode: "403",
            });
        }

        if (type === 'loginOTP') {
            console.log("[loginUser] Validating OTP...");
            const otpQuery = query(collection(db, "loginOtps"), where("mobile", "==", mobile), where("otp", "==", otp), where("status", "==", "active"));
            const otpSnapshot = await getDocs(otpQuery);

            if (otpSnapshot.empty) {
                console.log("[loginUser] Invalid or expired OTP.");
                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "Invalid or expired OTP",
                    responseCode: "401",
                });
            }

            const otpDoc = otpSnapshot.docs[0];
            const otpData = otpDoc.data();

            if (otpData.otpExpiry < Date.now()) {
                console.log("[loginUser] OTP has expired.");
                await updateDoc(doc(db, "loginOtps", otpDoc.id), { status: "expired" });

                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "OTP has expired",
                    responseCode: "401",
                });
            }

            console.log("[loginUser] OTP verified successfully.");
            await updateDoc(doc(db, "loginOtps", otpDoc.id), { status: "verified" });
        } else {
            console.log("[loginUser] Validating PIN...");
            const isMatchPin = await bcrypt.compare(pin, user.pin);
            if (!isMatchPin) {
                console.log("[loginUser] Invalid credentials.");
                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "Invalid credentials",
                    responseCode: "401",
                });
            }
        }

        console.log("[loginUser] Generating JWT token...");
        const token = jwt.sign(
            { id: user.id, userType: user.userType },
            process.env.JWT_SECRET,
            { algorithm: "HS256", expiresIn: "1h" }
        );

        const permissions = userPermissions[user.userType] || [];

        console.log("[loginUser] Login successful.");
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "Login successful",
            responseCode: "200",
            token,
            userDetails: {
                id: user.id,
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
        console.log("[signup] Signup request received:", req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("[signup] Validation errors:", errors.array());
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Validation errors",
                responseCode: "400",
                errors: errors.array(),
            });
        }

        const { emailId, mobile, pin, confirmPin, ...rest } = req.body;

        console.log("[signup] Checking for duplicate mobile...");
        const mobileQuery = query(collection(db, "users"), where("mobile", "==", mobile));
        const mobileSnapshot = await getDocs(mobileQuery);

        if (!mobileSnapshot.empty) {
            console.log("[signup] Duplicate mobile detected.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile already exists",
                responseCode: "400",
            });
        }

        if (emailId && emailId.trim() !== "") {
            console.log("[addUser] Checking for duplicate email...");
            const emailQuery = query(collection(db, "users"), where("emailId", "==", emailId));
            const emailSnapshot = await getDocs(emailQuery);

            if (!emailSnapshot.empty) {
                console.log("[addUser] Duplicate email detected.");
                return res.status(400).json({
                    responseStatus: "FAILED",
                    responseMsg: "Email already exists",
                    responseCode: "400",
                });
            }
        }

        if (pin !== confirmPin) {
            console.log("[signup] PIN and Confirm PIN do not match.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Pin and Confirm Pin do not match",
                responseCode: "400",
            });
        }

        console.log("[signup] Hashing PIN...");
        const hashedPin = await bcrypt.hash(pin, 10);

        console.log("[signup] Creating new account...");
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

        await addDoc(collection(db, "users"), newUser);

        console.log("[signup] Account created successfully.");
        res.status(201).json({
            responseStatus: "SUCCESS",
            responseMsg: "Congratulations! your account has been created successfully🎉",
            responseCode: "201",
            data: {
                id: newUser.id,
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
        console.log("[addUser] Add user request received:", req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log("[addUser] Validation errors:", errors.array());
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Validation errors",
                responseCode: "400",
                errors: errors.array(),
            });
        }

        const { emailId, mobile, pin, confirmPin, ...rest } = req.body;

        console.log("[addUser] Checking for duplicate mobile...");
        const mobileQuery = query(collection(db, "users"), where("mobile", "==", mobile));
        const mobileSnapshot = await getDocs(mobileQuery);

        if (!mobileSnapshot.empty) {
            console.log("[addUser] Duplicate mobile detected.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile already exists",
                responseCode: "400",
            });
        }

        if (emailId && emailId.trim() !== "") {
            console.log("[addUser] Checking for duplicate email...");
            const emailQuery = query(collection(db, "users"), where("emailId", "==", emailId));
            const emailSnapshot = await getDocs(emailQuery);

            if (!emailSnapshot.empty) {
                console.log("[addUser] Duplicate email detected.");
                return res.status(400).json({
                    responseStatus: "FAILED",
                    responseMsg: "Email already exists",
                    responseCode: "400",
                });
            }
        }

        if (pin !== confirmPin) {
            console.log("[addUser] PIN and Confirm PIN do not match.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Pin and Confirm Pin do not match",
                responseCode: "400",
            });
        }

        console.log("[addUser] Hashing PIN...");
        const hashedPin = await bcrypt.hash(pin, 10);

        console.log("[addUser] Creating new user...");
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

        await addDoc(collection(db, "users"), newUser);

        console.log("[addUser] User added successfully.");
        res.status(201).json({
            responseStatus: "SUCCESS",
            responseMsg: "User added successfully",
            responseCode: "201",
            user: {
                id: newUser.id,
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
    console.log("[fetchAllUsers] Fetching users...");
    try {
        const filters = {};

        // Dynamically build the filters object based on the request payload
        console.log("[fetchAllUsers] Building filters object...");
        for (const [key, value] of Object.entries(req.body)) {
            if (value && value !== "All" && key !== "start" && key !== "length") {
                filters[key] = value;
            }
        }
        console.log("[fetchAllUsers] Filters object:", filters);

        // Extract pagination parameters
        const start = parseInt(req.body.start) || 0; // Default to 0 if not provided
        const length = parseInt(req.body.length) || 10; // Default to 10 if not provided
        console.log("[fetchAllUsers] Pagination parameters - Start:", start, "Length:", length);

        // Add a filter to only fetch users with userType = 'USER'
        filters.userType = 'USER';

        // Build Firestore query
        console.log("[fetchAllUsers] Building Firestore query...");
        let userQuery = collection(db, "users");
        for (const [key, value] of Object.entries(filters)) {
            userQuery = query(userQuery, where(key, "==", value));
        }

        console.log("[fetchAllUsers] Fetching users from Firestore...");
        const userSnapshot = await getDocs(userQuery);

        // Apply pagination manually
        const users = userSnapshot.docs.slice(start, start + length).map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        const count = userSnapshot.size; // Total number of users matching the query

        console.log("[fetchAllUsers] Users fetched successfully. Count:", count);
        res.json({
            responseStatus: "SUCCESS",
            responseMsg: "Users fetched successfully",
            responseCode: "200",
            userList: users.map(user => ({
                id: user.id,
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
    console.log("[fetchUserByKey] Fetching user by key...");
    try {
        const { id, emailId, mobile } = req.body;
        console.log("[fetchUserByKey] Request body:", req.body);

        // Build Firestore query
        let userQuery = collection(db, "users");
        if (id) {
            userQuery = query(userQuery, where("id", "==", id));
        } else if (emailId) {
            userQuery = query(userQuery, where("emailId", "==", emailId));
        } else if (mobile) {
            userQuery = query(userQuery, where("mobile", "==", mobile));
        } else {
            console.log("[fetchUserByKey] No valid key provided.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "At least one key (id, emailId, or mobile) is required",
                responseCode: "400",
            });
        }

        console.log("[fetchUserByKey] Searching for user...");
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            console.log("[fetchUserByKey] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found!",
                responseCode: "404",
            });
        }

        const user = userSnapshot.docs[0].data();
        console.log("[fetchUserByKey] User found:", user);

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
    console.log("[updateUser] Updating user...");
    try {
        const userId = req.body.id; // Extract the `id` field from the request body
        console.log("[updateUser] User ID:", userId);

        // Validate the `id` field
        if (!userId) {
            console.log("[updateUser] User ID is missing.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "User ID is required",
                responseCode: "400",
            });
        }

        const updatedData = req.body; // Extract the updated data from the request body
        console.log("[updateUser] Updated data:", updatedData);

        // Query Firestore to find the document with the matching `id` field
        console.log("[updateUser] Searching for user in Firestore...");
        const userQuery = query(collection(db, "users"), where("id", "==", userId));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            console.log("[updateUser] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        // Get the Firestore document ID
        const userDocId = userSnapshot.docs[0].id;

        // Update the user document in Firestore
        console.log("[updateUser] Updating user in Firestore...");
        const userRef = doc(db, "users", userDocId);
        await updateDoc(userRef, updatedData);

        console.log("[updateUser] User updated successfully.");
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "User updated successfully",
            responseCode: "200",
            updatedUser: { id: userId, ...updatedData }, // Return the updated user
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
    console.log("[deleteUser] Deleting user...");
    try {
        const userId = req.params.id; // Extract the user ID from the request parameters
        console.log("[deleteUser] User ID:", userId);

        // Validate the user ID
        if (!userId) {
            console.log("[deleteUser] User ID is missing.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "User ID is required",
                responseCode: "400",
            });
        }

        // Reference to the user document in Firestore
        const userQuery = query(collection(db, "users"), where("id", "==", userId));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            console.log("[deleteUser] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        // Get the document ID of the user
        const userDocId = userSnapshot.docs[0].id;

        // Delete the user document
        console.log("[deleteUser] Deleting user from Firestore...");
        const userRef = doc(db, "users", userDocId);
        await deleteDoc(userRef);

        console.log("[deleteUser] User deleted successfully.");
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
        console.log("[generateOtp] Request received:", req.body);
        const { mobile, type } = req.body;

        if (!mobile) {
            console.log("[generateOtp] Mobile number is missing.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile number is required",
                responseCode: "400",
            });
        }

        console.log("[generateOtp] Finding user by mobile...");
        const userQuery = query(collection(db, "users"), where("mobile", "==", mobile));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            console.log("[generateOtp] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        const user = userSnapshot.docs[0].data();

        if (user.status !== "Active") {
            console.log("[generateOtp] User is not active.");
            return res.status(403).json({
                responseStatus: "FAILED",
                responseMsg: "User not active",
                responseCode: "403",
            });
        }

        // Generate a 6-digit OTP
        console.log("[generateOtp] Generating OTP...");
        const otp = crypto.randomInt(100000, 999999).toString();

        // Save OTP in Firestore
        console.log("[generateOtp] Marking existing OTPs as inactive...");
        const otpCollection = type === 'loginOTP' ? "loginOtps" : "forgotPins";

        const otpQuery = query(
            collection(db, otpCollection),
            where("mobile", "==", mobile),
            where("status", "==", "active")
        );
        const otpSnapshot = await getDocs(otpQuery);

        // Mark existing OTPs as inactive
        const batch = writeBatch(db); // Use writeBatch instead of db.batch()
        otpSnapshot.forEach((doc) => {
            batch.update(doc.ref, { status: "inActive" });
        });
        await batch.commit();

        console.log("[generateOtp] Saving new OTP...");
        await addDoc(collection(db, otpCollection), {
            mobile,
            otp,
            otpExpiry: Date.now() + 5 * 60 * 1000, // OTP valid for 5 minutes
            status: "active",
            created: new Date().toISOString(),
        });

        const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;

        console.log(`[generateOtp] OTP for ${formattedMobile}: ${otp}`);

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
        console.log("[verifyOtp] Request received:", req.body);
        const { mobile, otp } = req.body;

        // Validate input
        if (!mobile || !otp) {
            console.log("[verifyOtp] Mobile number or OTP is missing.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile number and OTP are required",
                responseCode: "400",
            });
        }

        // Find the user by mobile
        console.log("[verifyOtp] Finding user by mobile...");
        const userQuery = query(collection(db, "users"), where("mobile", "==", mobile));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            console.log("[verifyOtp] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        const user = userSnapshot.docs[0].data();

        if (user.status !== "Active") {
            console.log("[verifyOtp] User is not active.");
            return res.status(403).json({
                responseStatus: "FAILED",
                responseMsg: "User not active",
                responseCode: "403",
            });
        }

        // Find the active OTP for the mobile
        console.log("[verifyOtp] Finding active OTP...");
        const otpQuery = query(
            collection(db, "forgotPins"),
            where("mobile", "==", mobile),
            where("otp", "==", otp),
            where("status", "==", "active")
        );
        const otpSnapshot = await getDocs(otpQuery);

        if (otpSnapshot.empty) {
            console.log("[verifyOtp] Invalid or expired OTP.");
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
            console.log("[verifyOtp] OTP has expired.");
            await updateDoc(doc(db, "forgotPins", otpDoc.id), { status: "expired" });

            return res.status(401).json({
                responseStatus: "FAILED",
                responseMsg: "OTP has expired",
                responseCode: "401",
            });
        }

        // Clear OTP after successful verification
        console.log("[verifyOtp] Marking OTP as verified...");
        await updateDoc(doc(db, "forgotPins", otpDoc.id), { status: "verified" });

        // Generate JWT token
        console.log("[verifyOtp] Generating JWT token...");
        const token = jwt.sign(
            { id: user.id, userType: user.userType }, // Payload
            process.env.JWT_SECRET, // Secret key
            { algorithm: "HS256", expiresIn: "1h" } // Token expiration time
        );

        console.log("[verifyOtp] OTP verified successfully.");
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
        console.log("[changePin] Request received:", req.body);
        const { mobile, pin, confirmPin } = req.body;

        // Validate input
        if (!mobile || !pin || !confirmPin) {
            console.log("[changePin] Missing required fields.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile, PIN, and Confirm PIN are required",
                responseCode: "400",
            });
        }

        // Find the user by mobile
        console.log("[changePin] Finding user by mobile...");
        const userQuery = query(collection(db, "users"), where("mobile", "==", mobile));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            console.log("[changePin] User not found.");
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
            console.log("[changePin] New PIN and Confirm PIN do not match.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "New PIN and Confirm PIN do not match",
                responseCode: "400",
            });
        }

        console.log("[changePin] Checking if new PIN is the same as the old PIN...");
        const isSamePin = await bcrypt.compare(pin, user.pin);

        if (isSamePin) {
            console.log("[changePin] New PIN cannot be the same as the old PIN.");
            return res.status(402).json({
                responseStatus: "FAILED",
                responseMsg: "New PIN cannot be the same as the old PIN",
                responseCode: "402",
            });
        }

        // Hash the new PIN
        console.log("[changePin] Hashing new PIN...");
        const hashedPin = await bcrypt.hash(pin, 10);

        // Update the user's PIN in Firestore
        console.log("[changePin] Updating user's PIN...");
        const userRef = doc(db, "users", userDoc.id);
        await updateDoc(userRef, { pin: hashedPin });

        console.log("[changePin] PIN updated successfully.");
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