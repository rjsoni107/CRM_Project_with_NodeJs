const User = require("../modules/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { userPermissions } = require("../util/Base")
const crypto = require("crypto");
const ForgotPIN = require("../modules/forgotPinModel");
const LoginOTP = require("../modules/loginOtpModel");

function generateUniqueId() {
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
}

exports.createDefaultAdmin = async () => {
    try {
        // Check if an admin user already exists
        const existingAdmin = await User.findOne({ userType: "ADMIN" });
        if (existingAdmin) {
            console.log("Default admin already exists.");
            return;
        }

        // Create a default admin user
        const hashedPin = await bcrypt.hash("111111", 10); // Default PIN (hashed)
        const adminUser = new User({
            id: "ADMIN001", // Unique ID for the admin
            firstName: "Default",
            status: active,
            lastName: "Admin",
            emailId: "admin@example.com", // Default email
            mobile: "1111111111", // Default mobile number
            pin: hashedPin,
            userType: "ADMIN", // Set user type as ADMIN
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        });

        // Save the admin user to the database
        await adminUser.save();
        console.log("Admin created successfully.");
    } catch (error) {
        console.error("Error creating default admin:", error.message);
    }
}

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { mobile, pin, type, otp } = req.body;

        // Find the user by email
        const user = await User.findOne({ mobile, });
        const isNotActive = await User.findOne({ mobile, status: "Active" });
        if (!user) {
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        if (!isNotActive) {
            return res.status(403).json({
                responseStatus: "FAILED",
                responseMsg: "User not active",
                responseCode: "403",
            });
        }

        if (type === 'loginOTP') {
            // Find the active OTP for the mobile
            const loginOtp = await LoginOTP.findOne({ mobile, otp, status: "active" });

            if (!loginOtp) {
                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "Invalid or expired OTP",
                    responseCode: "401",
                });
            }

            // Check if OTP is expired
            if (loginOtp.otpExpiry < Date.now()) {
                // Mark the OTP as expired
                loginOtp.status = "expired";
                await loginOtp.save();

                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "OTP has expired",
                    responseCode: "401",
                });
            }

            // Clear OTP after successful verification
            loginOtp.status = "verified";
            await loginOtp.save();

        } else {
            // Validate the PIN
            if (!user.pin) {
                return res.status(400).json({
                    responseStatus: "FAILED",
                    responseMsg: "User PIN is not set",
                    responseCode: "400",
                });
            }

            // Compare the provided pin with the hashed pin
            const isMatchPin = await bcrypt.compare(pin, user.pin);
            if (!isMatchPin) {
                return res.status(401).json({
                    responseStatus: "FAILED",
                    responseMsg: "Invalid credentials",
                    responseCode: "401",
                });
            }
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: user.id, userType: user.userType }, // Payload
            process.env.JWT_SECRET, // Secret key (store in .env)
            { algorithm: "HS256", expiresIn: "1h" } // Token expiration time
        );

        // Get permissions based on user type
        const permissions = userPermissions[user.userType] || [];

        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "Login successful",
            responseCode: "200",
            token,
            userDetails: {
                id: user.id,
                emailId: user.emailId,
                mobile: user.mobile,
                userType: user.userType,
                permissions
            }, // Exclude the password from the response
        });
    } catch (error) {
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error logging in: " + error.message,
            responseCode: "500",
        });
    }
};

// Add User
exports.addUser = async (req, res) => {
    try {
        // Validate the request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Validation errors",
                responseCode: "400",
                errors: errors.array(),
            });
        }

        // Check for duplicate email or mobile
        const { emailId, mobile, pin, confirmPin } = req.body;
        const existingUser = await User.findOne({ $or: [{ emailId }, { mobile }] });
        if (existingUser) {
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Duplicate entry detected: Email or Mobile already exists",
                responseCode: "400",
            });
        }
        const isValidPin = pin === confirmPin;

        if (!isValidPin) {
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Pin and Confirm Pin is not match",
                responseCode: "400",
                errors: errors.array(),
            });
        }

        const hashedPin = await bcrypt.hash(pin, 10); // 10 is the salt rounds
        // Hash the pin

        // Create a new user
        const newUser = new User({
            ...req.body,
            pin: hashedPin,
            id: generateUniqueId(),
            userType: "USER",
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
        });

        // Save the user to the database
        await newUser.save();

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
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error saving user: " + error.message,
            responseCode: "500",
        });
    }
};

// Fetch All Users
exports.fetchAllUsers = async (req, res) => {
    console.log("Fetching users...");
    try {
        const query = {};

        // Dynamically build the query object based on the request payload
        for (const [key, value] of Object.entries(req.body)) {
            if (value && value !== "All" && key !== "start" && key !== "length") {
                query[key] = value;
            }
        }

        // Extract pagination parameters
        const start = parseInt(req.body.start) || 0; // Default to 0 if not provided
        const length = parseInt(req.body.length) || 10; // Default to 10 if not provided

        // Fetch users with pagination
        const users = await User.find(query).skip(start).limit(length);

        // Count total users for the query (without pagination)
        const countPerPage = await User.countDocuments(query);

        if (users && users.length > 0) {
            res.json({
                responseStatus: "SUCCESS", // Response status
                responseMsg: "Users fetched successfully", // Response message
                responseCode: "200", // Response code
                userList: users, // User list
                countPerPage, // Total number of users matching the query
            });
        } else {
            res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "No users found!",
                responseCode: "404",
            });
        }
    } catch (error) {
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error fetching users: " + error.message,
            responseCode: "500",
        });
    }
};

// Fetch User by Key
exports.fetchUserByKey = async (req, res) => {
    try {
        let query = {};
        if (req.body.id) {
            query = { id: req.body.id }; // Search by "id" if it exists
            console.log("Searching by ID:", query); // Log the query for debugging
        }

        // Search for the user
        const user = await User.findOne(query);
        console.log("User found:", user); // Log the found user for debugging

        if (user) {
            res.json({
                responseStatus: "Success",
                responseMsg: "User fetched successfully",
                responseCode: "200",
                user,
            });
        } else {
            res.status(404).json({
                responseStatus: "Error",
                responseMsg: "User not found!",
                responseCode: "404",
            });
        }
    } catch (error) {
        res.status(500).json({
            responseStatus: "Error",
            responseMsg: "Error fetching user: " + error.message,
            responseCode: "500",
        });
    }
};

// Update User by ID
exports.updateUser = async (req, res) => {
    try {
        const userId = req.body.id; // Extract the `id` field from the request body

        // Validate the `id` field
        if (!userId) {
            return res.status(400).json({
                responseStatus: "Error",
                responseMsg: "User ID is required",
                responseCode: "400",
            });
        }

        const updatedData = req.body; // Extract the updated data from the request body

        // Update the user in the database using the `id` field
        const user = await User.findOneAndUpdate({ id: userId }, updatedData, { new: true, runValidators: true });

        if (!user) {
            return res.status(404).json({
                responseStatus: "Error",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        res.status(200).json({
            responseStatus: "Success",
            responseMsg: "User updated successfully",
            updatedUser: user, // Return the updated user
            responseCode: "200",
        });
    } catch (error) {
        res.status(500).json({
            responseStatus: "Error",
            responseMsg: "Error updating user: " + error.message,
            responseCode: "500",
        });
    }
};

// Delete User by ID
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({
                responseStatus: "Error",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }
        res.status(200).json({
            responseStatus: "Success",
            responseMsg: `User deleted successfully: ${user.name}`,
            deletedUser: user, // Optional: Include deleted user details
            responseCode: "200",
        });
    } catch (error) {
        res.status(500).json({
            responseStatus: "Error",
            responseMsg: "Error deleting user: " + error.message,
            responseCode: "500",
        });
    }
};

exports.generateOtp = async (req, res) => {
    try {
        const { mobile, type } = req.body;

        if (!mobile) {
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile number is required",
                responseCode: "400",
            });
        }

        const user = await User.findOne({ mobile });
        // Find the user by mobile
        if (!user) {
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        const isNotActive = await User.findOne({ mobile, status: "Active" });
        if (!isNotActive) {
            return res.status(403).json({
                responseStatus: "FAILED",
                responseMsg: "User not active",
                responseCode: "403",
            });
        }

        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Save OTP in the database
        const collectionName = type === 'loginOTP' ? LoginOTP : ForgotPIN;

        await collectionName.updateMany(
            { mobile, status: "active" },
            { $set: { status: "inActive" } }
        );

        const newOtpEntry = new collectionName({
            mobile,
            otp,
            otpExpiry: Date.now() + 5 * 60 * 1000,
            status: "active",
            created: new Date().toISOString(),
        });
        await newOtpEntry.save();

        const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;

        console.log(`OTP for ${formattedMobile}: ${otp}`);

        res.status(200).json({
            type,
            mobile,
            responseStatus: "SUCCESS",
            responseMsg: "OTP sent successfully",
            responseCode: "200",
        });
    } catch (error) {
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error generating OTP: " + error.message,
            responseCode: "500",
        });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { mobile, otp } = req.body;

        // Validate input
        if (!mobile || !otp) {
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "Mobile number and OTP are required",
                responseCode: "400",
            });
        }

        // Find the user by mobile
        const user = await User.findOne({ mobile });
        if (!user) {
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        const isNotActive = await User.findOne({ mobile, status: "Active" });
        if (!isNotActive) {
            return res.status(403).json({
                responseStatus: "FAILED",
                responseMsg: "User not active",
                responseCode: "403",
            });
        }

        // Find the active OTP for the mobile
        const forgotPIN = await ForgotPIN.findOne({ mobile, otp, status: "active" });

        if (!forgotPIN) {
            return res.status(401).json({
                responseStatus: "FAILED",
                responseMsg: "Invalid or expired OTP",
                responseCode: "401",
            });
        }

        // Check if OTP is expired
        if (forgotPIN.otpExpiry < Date.now()) {
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
        forgotPIN.status = "verified";
        await forgotPIN.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, userType: user.userType }, // Payload
            process.env.JWT_SECRET, // Secret key
            { algorithm: "HS256", expiresIn: "1h" } // Token expiration time
        );

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
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error verifying OTP: " + error.message,
            responseCode: "500",
        });
    }
};

exports.changePin = async (req, res) => {
    try {
        const { mobile, pin, confirmPin } = req.body;

        // Find the user by mobile
        const user = await User.findOne({ mobile });

        if (!user) {
            return res.status(404).json({
                responseStatus: "FAILED",
                responseMsg: "User not found",
                responseCode: "404",
            });
        }

        // Validate the new PIN and confirm PIN
        if (pin !== confirmPin) {
            return res.status(400).json({
                responseStatus: "FAILED",
                responseMsg: "New PIN and Confirm PIN do not match",
                responseCode: "400",
            });
        }

        const isSamePin = await bcrypt.compare(pin, user.pin);

        if (isSamePin) {
            return res.status(402).json({
                responseStatus: "FAILED",
                responseMsg: "New PIN cannot be same as old PIN",
                responseCode: "402",
            });
        }

        // Hash the new PIN
        const hashedPin = await bcrypt.hash(pin, 10);

        // Update the user's PIN
        user.pin = hashedPin;
        await user.save();

        res.status(200).json({
            responseStatus: "SUCCESS",
            responseMsg: "PIN updated successfully",
            responseCode: "200",
        });
    } catch (error) {
        res.status(500).json({
            responseStatus: "FAILED",
            responseMsg: "Error updating PIN: " + error.message,
            responseCode: "500",
        });
    }
};