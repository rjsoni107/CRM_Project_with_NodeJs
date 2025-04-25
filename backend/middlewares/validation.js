const { body } = require("express-validator");

exports.validateAddUser = [
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("emailId").isEmail().withMessage("Valid email is required"),
    body("mobile").isMobilePhone().withMessage("Valid mobile number is required"),
    body("pin").isLength({ min: 6 }).withMessage("PIN must be at least 6 characters long"),
    body("confirmPin").isLength({ min: 6 }).withMessage("Confirm PIN must be at least 6 characters long"),
];