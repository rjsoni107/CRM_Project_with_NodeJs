import { ENDPOINTS } from "../../../utility/ApiEndpoints";

const VerifyOtpDTO = ({
    state,
    fetchData,
    basePathAction,
    setState,
    setShowLoader,
    setIsTimerActive,
    setErrorMessage,
    validateFormHandler,
    apiPathAction
}) => {

    const { mobile, otp, pin, type } = state.payload;

    const openPage = (pathName, obj) => {
        setState(prevState => ({
            ...prevState,
            redirect: pathName,
            redirectState: obj,
        }));
    };

    const errorMsgHandler = (errortype, otpError) => {
        setErrorMessage((prevState) => ({
            ...prevState,
            errorType: errortype,
            otpError: otpError
        }));
    };

    const getOtpHandler = async (mobile, type) => {
        setShowLoader(true);
        const payload = { mobile, type };
        const fetchAction = apiPathAction(ENDPOINTS.GENERATE_OTP_ACTION)

        try {
            const response = await fetchData('POST', fetchAction, payload);
            const { responseStatus, responseMsg } = response;
            if (response && responseStatus === "SUCCESS") {
                errorMsgHandler(responseStatus, responseMsg);
                setIsTimerActive(true);

                setTimeout(() => {
                    errorMsgHandler(null, null);
                }, 5000);
            } else {
                errorMsgHandler(responseStatus, responseMsg);
            }
        } catch (err) {
            console.error("Error during OTP generation:", err);
        } finally {
            setShowLoader(false)
        }
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        const that = event.target;

        if (validateFormHandler(that)) {
            const payload = { mobile, otp, pin, type };
            const isLoginOtp = type === 'loginOTP'
            const fetchActionType = isLoginOtp ? ENDPOINTS.LOGIN_ACTION : ENDPOINTS.VERIFY_OTP_ACTION;
            const redirectActionType = isLoginOtp ? ENDPOINTS.DASHBOARD : ENDPOINTS.CHANGE_PIN
            setShowLoader(true)
            try {
                const response = await fetchData('POST', apiPathAction(fetchActionType), payload);
                const { responseStatus, responseMsg, token, userDetails } = response;
                setState(prevState => ({ ...prevState, showLoader: false }));

                if (response && responseStatus === "SUCCESS") {
                    if (type === 'loginOTP') {
                        localStorage.setItem("authToken", token);
                        localStorage.setItem('globalObj', JSON.stringify(userDetails));
                        openPage(basePathAction(redirectActionType), userDetails)
                    } else {
                        openPage(basePathAction(redirectActionType), response)
                    }
                } else {
                    errorMsgHandler(responseStatus, responseMsg);
                    setTimeout(() => {
                        errorMsgHandler(null, null);
                    }, 5000);
                }
            } catch (err) {
                console.error("Error during OTP verification:", err);
            } finally {
                setShowLoader(false)
            }
        }
    };

    return {
        getOtpHandler,
        handleVerifyOtp,
        errorMsgHandler,
    };
}

export default VerifyOtpDTO;