const express = require("express");
const commonController = require('../controllers/commonController')
const mainController = require("../controllers/mainController");
const { validateAddUser } = require("../middlewares/validation");
const { verifyToken } = require("../middlewares/authMiddleware");
const router = express.Router();

// Login Routes
router.post("/loginAction", mainController.loginUser);
router.post("/changePin", mainController.changePin);
// router.post("/forgotPin", mainController.forgotPin);
router.post("/generateOtp", mainController.generateOtp);
router.post("/verifyOtp", mainController.verifyOtp);

// User Routes
router.post("/getUserList", verifyToken, mainController.fetchAllUsers);
router.post("/addUser", validateAddUser, verifyToken, mainController.addUser);
router.post("/getUserDetails", verifyToken, mainController.fetchUserByKey);
router.put("/updateUserData", verifyToken, mainController.updateUser);
router.delete("/deleteUserData/:id", verifyToken, mainController.deleteUser);

// Common Routes
router.get("/getCountryList", commonController.getCountryList);
router.get("/getStateList/:countryCode", commonController.getStateList);
router.get("/getCityList/:countryCode/:stateCode", commonController.getCityList);

module.exports = router;