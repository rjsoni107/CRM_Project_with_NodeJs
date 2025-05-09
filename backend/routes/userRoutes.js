const express = require("express");
const commonController = require('../controllers/commonController')
const mainController = require("../controllers/mainController");
const { validateUser } = require("../middlewares/validation");
const { verifyToken } = require("../middlewares/authMiddleware");
const router = express.Router();

// Login Routes
router.post("/loginAction", mainController.login);
router.post("/signupAction", validateUser, mainController.signup);
router.post("/changePinAction", mainController.changePin);
router.post("/generateOtpAction", mainController.generateOtp);
router.post("/verifyOtpAction", mainController.verifyOtp);

// User Routes
router.post("/getUserListAction", verifyToken, mainController.fetchAllUsers);
router.post("/addUserAction", validateUser, verifyToken, mainController.addUser);
router.post("/getUserDetailsAction", verifyToken, mainController.fetchUserByKey);
router.put("/updateUserAction", verifyToken, mainController.updateUser);
router.delete("/deleteUserAction/:id", verifyToken, mainController.deleteUser);

// Common Routes
router.get("/getCountryList", commonController.getCountryList);
router.get("/getStateList/:countryCode", commonController.getStateList);
router.get("/getCityList/:countryCode/:stateCode", commonController.getCityList);

module.exports = router;
