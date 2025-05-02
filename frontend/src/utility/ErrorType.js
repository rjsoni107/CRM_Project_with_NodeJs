const ERROR_TYPE = {
    mobile: {
        IS_BLANK: "Please enter mobile number",
        IS_INVALID: "Invalid mobile number",
        IS_EXIST: "Mobile number already exists"
    },
    mobileNumber: {
        IS_BLANK: "Please enter mobile number",
        IS_INVALID: "Invalid mobile number",
        IS_EXIST: "Mobile number already exists"
    },
    emailId: {
        IS_BLANK: "Please enter email id",
        IS_INVALID: "Invalid email id",
        IS_EXIST: "Email id already exists"
    },
    email: {
        IS_BLANK: "Please enter email id",
        IS_INVALID: "Invalid email id",
        IS_EXIST: "Email id already exists"
    },
    firstName: {
        IS_BLANK: "Please enter first name",
        IS_INVALID: "Invalid first name",
    },
    lastName: {
        IS_BLANK: "Please enter last name",
        IS_INVALID: "Invalid last name",
    },
    businessName: {
        IS_BLANK: "Please enter business name",
        IS_INVALID: "Invalid business name",
    },
    customerName: {
        IS_BLANK: "Please enter customer name",
        IS_INVALID: "Invalid customer name",
    },
    username: {
        IS_BLANK: "Please enter user name",
        IS_INVALID: "Invalid user name",
    },
    zip: {
        IS_BLANK: "Please enter zip code",
        IS_INVALID: "Invalid zip code",
    },
    dob: {
        IS_BLANK: "Please enter date of birth",
        IS_INVALID: "Invalid date of birth",
    },
    status: {
        IS_BLANK: "Please select status",
    },
    gender: {
        IS_BLANK: "Please select gender",
    },
    pin: {
        IS_BLANK: "Please enter PIN",
        IS_INVALID: "PIN must be 6 digits",
    },
    confirmPin: {
        IS_BLANK: "Please enter confirm PIN",
        IS_INVALID: "Confirm PIN must be 6 digits",
    },
    accountId: {
        IS_BLANK: "Please enter account id",
        IS_INVALID: "Invalid account id",
    },
    fixedCharge: {
        IS_BLANK: "Please enter payment charges",
        IS_INVALID: "Invalid payment charges",
    },
    accountName: {
        IS_BLANK: "Please select account name",
    },
    fromAccount: {
        IS_BLANK: "Please select from account",
    },
    toAccount: {
        IS_BLANK: "Please select to account",
    },
    amount: {
        IS_BLANK: "Please enter amount",
        IS_INVALID: "Please enter valid amount",
    },
    otp: {
        IS_BLANK: "Please enter OTP",
        IS_INVALID: "Invalid OTP",
    },
};

const getErrorMessage = (field, errorType) => {
    return ERROR_TYPE[field]?.[errorType] || "Unknown error";
};

export { getErrorMessage };
