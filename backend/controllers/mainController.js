const User = require("../modules/userModelMongo");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { userPermissions } = require("../util/Base");
const crypto = require("crypto");
const ForgotPIN = require("../modules/forgotPinModel");
const LoginOTP = require("../modules/loginOtpModel");

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
        const existingAdmin = await User.findOne({ userType: "ADMIN" });
        if (existingAdmin) {
            console.log("[createDefaultAdmin] Default admin already exists.");
            return;
        }

        console.log("[createDefaultAdmin] Creating default admin...");
        const hashedPin = await bcrypt.hash("111111", 10); // Default PIN (hashed)
        await User.create({
            id: generateUniqueId(),
            firstName: "Default",
            status: "Active",
            lastName: "Admin",
            emailId: "admin@example.com",
            mobile: "1111111111",
            pin: hashedPin,
            userType: "ADMIN",
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
        const user = await User.findOne({ mobile });
        const isNotActive = await User.findOne({ mobile, status: "Active" });

        if (!user) {
            console.log("[loginUser] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        if (!isNotActive) {
            console.log("[loginUser] User is not active.");
            return res.status(403).json({
                responseStatus: "FAILED",
                responseMsg: "User not active",
                responseCode: "403",
            });
        }

        if (type === 'loginOTP') {
            console.log("[loginUser] Validating OTP...");
            const loginOtp = await LoginOTP.findOne({ mobile, otp, status: "active" });

            if (!loginOtp) {
                console.log("[loginUser] Invalid or expired OTP.");
                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "Invalid or expired OTP",
                    responseCode: "401",
                });
            }

            if (loginOtp.otpExpiry < Date.now()) {
                console.log("[loginUser] OTP has expired.");
                loginOtp.status = "expired";
                await loginOtp.save();

                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "OTP has expired",
                    responseCode: "401",
                });
            }

            console.log("[loginUser] OTP verified successfully.");
            loginOtp.status = "verified";
            await loginOtp.save();
        } else {
            console.log("[loginUser] Validating PIN...");
            if (!user.pin) {
                console.log("[loginUser] User PIN is not set.");
                return res.status(400).json({
                    responseStatus: "FAILED",
                    responseMsg: "User PIN is not set",
                    responseCode: "400",
                });
            }

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
                name: `${user.firstName} ${isValueExist(user.lastName) ? user.lastName : ''}`,
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

        const { emailId, mobile, pin, confirmPin } = req.body;
        console.log("[signup] Checking for duplicate email or mobile...");
        const existingUser = await User.findOne({
            $or: [{ emailId }, { mobile }]
        },
        );

        if (existingUser) {
            console.log("[signup] Duplicate entry detected.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Email or Mobile already exists",
                responseCode: "400",
            });
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
        const newUser = await User.create({
            ...req.body,
            id: generateUniqueId(),
            pin: hashedPin,
            userType: 'MERCHANT',
            status: 'Active',
        });

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

        const { emailId, mobile, pin, confirmPin } = req.body;
        console.log("[addUser] Checking for duplicate email or mobile...");
        const existingUser = await User.findOne({
            or: [{ emailId }, { mobile }]
        },
        );

        if (existingUser) {
            console.log("[addUser] Duplicate entry detected.");
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Duplicate entry detected: Email or Mobile already exists",
                responseCode: "400",
            });
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
        const newUser = await User.create({
            ...req.body,
            id: generateUniqueId(),
            pin: hashedPin,
            userType: 'USER',
            status: 'Active',
        });

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
        const query = {};

        // Dynamically build the query object based on the request payload
        console.log("[fetchAllUsers] Building query object...");
        for (const [key, value] of Object.entries(req.body)) {
            if (value && value !== "All" && key !== "start" && key !== "length") {
                query[key] = value;
            }
        }
        console.log("[fetchAllUsers] Query object:", query);

        // Extract pagination parameters
        const start = parseInt(req.body.start) || 0; // Default to 0 if not provided
        const length = parseInt(req.body.length) || 10; // Default to 10 if not provided
        console.log("[fetchAllUsers] Pagination parameters - Start:", start, "Length:", length);

        // Add a filter to only fetch users with userType = 'USER'
        query.userType = 'USER';

        // Fetch users with pagination
        console.log("[fetchAllUsers] Fetching users from database...");
        const users = await User.find(query).skip(start).limit(length);
        const count = await User.countDocuments(query);

        console.log("[fetchAllUsers] Users fetched successfully. Count:", count);
        res.json({
            responseStatus: "SUCCESS",
            responseMsg: "Users fetched successfully",
            responseCode: "200",
            userList: users.map(user => ({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
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

        const query = {};
        if (id) query.id = id;
        if (emailId) query.emailId = emailId;
        if (mobile) query.mobile = mobile;
        console.log("[fetchUserByKey] Query object:", query);

        // Search for the user
        console.log("[fetchUserByKey] Searching for user...");
        const user = await User.findOne(query);
        console.log("[fetchUserByKey] User found:", user);

        if (user) {
            res.json({
                responseStatus: "SUCCESS",
                responseMsg: "User fetched successfully",
                responseCode: "200",
                user,
            });
        } else {
            console.log("[fetchUserByKey] User not found.");
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

        // Update the user in the database
        console.log("[updateUser] Updating user in database...");
        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            updatedData,
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            console.log("[updateUser] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        console.log("[updateUser] User updated successfully.");
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "User updated successfully",
            responseCode: "200",
            updatedUser, // Return the updated user
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
        const userId = req.params.id;
        console.log("[deleteUser] User ID:", userId);

        // Delete the user
        console.log("[deleteUser] Deleting user from database...");
        const user = await User.deleteOne({ id: userId });

        if (result.deletedCount === 0) {
            console.log("[deleteUser] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        console.log("[deleteUser] User deleted successfully.");
        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: `User deleted successfully`,
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
        const user = await User.findOne({ mobile });
        // Find the user by mobile
        if (!user) {
            console.log("[generateOtp] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

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

        // Save OTP in the database
        console.log("[generateOtp] Marking existing OTPs as inactive...");
        const collectionName = type === 'loginOTP' ? LoginOTP : ForgotPIN;

        await collectionName.updateMany(
            { mobile, status: "active" },
            { $set: { status: "inActive" } }
        );

        console.log("[generateOtp] Saving new OTP...");
        const newOtpEntry = new collectionName({
            mobile,
            otp,
            otpExpiry: Date.now() + 5 * 60 * 1000,
            status: "active",
            created: new Date().toISOString(),
        });
        await newOtpEntry.save();

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
        const user = await User.findOne({ mobile });
        if (!user) {
            console.log("[verifyOtp] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

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
        const forgotPIN = await ForgotPIN.findOne({ mobile, otp, status: "active" });

        if (!forgotPIN) {
            console.log("[verifyOtp] Invalid or expired OTP.");
            return res.status(401).json({
                responseStatus: "FAILED",
                responseMsg: "Invalid or expired OTP",
                responseCode: "401",
            });
        }

        // Check if OTP is expired
        if (forgotPIN.otpExpiry < Date.now()) {
            console.log("[verifyOtp] OTP has expired.");
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
        console.log("[verifyOtp] Marking OTP as verified...");
        forgotPIN.status = "verified";
        await forgotPIN.save();

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

        // Find the user by mobile
        console.log("[changePin] Finding user by mobile...");
        const user = await User.findOne({ mobile });

        if (!user) {
            console.log("[changePin] User not found.");
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

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
                responseMsg: "New PIN cannot be same as old PIN",
                responseCode: "402",
            });
        }

        // Hash the new PIN
        console.log("[changePin] Hashing new PIN...");
        const hashedPin = await bcrypt.hash(pin, 10);

        // Update the user's PIN
        console.log("[changePin] Updating user's PIN...");
        user.pin = hashedPin;
        await user.save();

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