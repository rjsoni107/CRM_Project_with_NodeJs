import { ENDPOINTS } from "../../../utility/ApiEndpoints";

const VerifyOtpDTO = (
    { state,
        setError,
        fetchData,
        basePathAction,
        setState,
        setShowLoader,
        setIsTimerActive,
        setErrorMessage,
        validateFormHandler,
    }) => {

    const { mobile, otp } = state.payload;

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
        const fetchAction = basePathAction(ENDPOINTS.GENERATE_OTP)

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

    const handleSubmit = async (event) => {
        event.preventDefault();
        const that = event.target;

        if (validateFormHandler(that)) {
            const payload = { mobile, otp };
            const fetchAction = basePathAction(ENDPOINTS.VERIFY_OTP);
            const redirectAction = basePathAction(ENDPOINTS.DASHBOARD);
            setShowLoader(true)
            try {
                const response = await fetchData('POST', fetchAction, payload);
                const { responseStatus, responseMsg } = response;
                setState(prevState => ({ ...prevState, showLoader: false }));

                if (response && responseStatus === "SUCCESS") {
                    openPage(redirectAction, response)
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
        handleSubmit,
        errorMsgHandler,
    };
}

export default VerifyOtpDTO;