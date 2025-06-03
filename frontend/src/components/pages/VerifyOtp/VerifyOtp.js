import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { TextInput } from '../../formElements/FormElementsImport';
import { ENDPOINTS } from '../../../utility/ApiEndpoints';
import ValidationHandler from '../../../utility/ValidationHandler';
import VerifyOtpDTO from './VerifyOtpDTO';
import Base from '../../../util/Base';
import Loader from '../../loader/Loader';
import Timer from '../../timer/Timer';
import '../Login/login.css';

const VerifyOtp = () => {
    const location = useLocation();
    const { mobile, type, responseStatus, responseMsg } = location.state || {};
    const otpPinRef = useRef(null);
    const timerSectionRef = useRef(null);
    const [showLoader, setShowLoader] = useState(false);
    const [isTimerActive, setIsTimerActive] = useState(true);
    const [state, setState] = useState({
        payload: {
            userName: mobile || "",
            type: type || "",
            otp: "",
            pin: ""
        },
        redirect: null,
        redirectState: null,
    });

    const [errorMessage, setErrorMessage] = useState({
        errorType: responseStatus || null,
        otpError: responseMsg || null,
    });
    const { fetchData, basePathAction, apiPathAction } = Base();

    const { validateInputHandler, inputChangeHandler, inputMessageHandler, validateFormHandler } = ValidationHandler();
    const { payload, redirect, redirectState } = state;

    const stateContext = {
        state,
        fetchData,
        basePathAction,
        setState,
        setShowLoader,
        setIsTimerActive,
        setErrorMessage,
        validateFormHandler,
        apiPathAction
    }

    const { getOtpHandler, handleVerifyOtp, errorMsgHandler } = VerifyOtpDTO(stateContext);

    useEffect(() => {
        const timer = setTimeout(() => {
            errorMsgHandler(null, null);
        }, 5000);

        return () => clearTimeout(timer);
    }, [errorMsgHandler]);

    if (redirect) return <Navigate to={redirect} state={redirectState} />;

    const loader = showLoader && <Loader processing={true} approvalNotification={false} />;
    const timer = isTimerActive && <Timer duration={59} onResend={() => getOtpHandler(mobile, type)} />;

    return (
        location.state ? (
            <div>
                <div className="login-wrapper">
                    {/* Left Section with Background */}
                    <div className="login-left">
                        <div className="login-left-content">
                            <div className='flex justify-center login-mobile-logo-container'>
                                <img src={`${window.basePath}/img/logo192.png`} alt="ChatSync-Logo" className='md:h-[120px] h-[65px] login-mobile-logo' />
                            </div>
                            <h1 className="fs-20 fs-sm-24 fs-md-36 fw-700">ChatSync</h1>
                            <p className="fs-12 fs-sm-14 fs-md-16 fw-400">Connect Together With Your Friends</p>
                        </div>
                    </div>

                    {/* Right Section with Login Form */}
                    <div className="login-right">
                        <div className="login-card p-20">
                            <div className="text-center">
                                <h1 className="login-title fs-18 fs-sm-20 fs-md-24 mt-5 md:mt-0 sm:mt-0">OTP Verification</h1>
                                <p className="login-subtitle fs-12 fs-sm-14 fs-md-16 mb-15 md:mb-5">One Time Password (OTP) has been sent via SMS to <span className='fw-bold'>+91-{mobile}</span></p>
                                <p className={`fs-12 ${errorMessage.errorType === 'SUCCESS' ? 'text-success' : 'text-danger'}`} >{errorMessage.otpError}</p>
                            </div>
                            <form className="form-section">
                                <div className="w-full">
                                    <TextInput
                                        ref={otpPinRef}
                                        label="OTP"
                                        name="otp"
                                        type="password"
                                        id="otp"
                                        placeholder="Enter 6 digit OTP"
                                        value={payload.otp || ''}
                                        className="form-control input-field"
                                        isRequired={true}
                                        maxLength={6}
                                        onChange={evt => {
                                            inputChangeHandler(evt, setState);
                                            inputMessageHandler(evt, 'HIDE', 'error');
                                        }}
                                        onBlur={evt => validateInputHandler(evt)}
                                        dataType="NUMBER"
                                        dataValidation="PIN"
                                    />
                                </div>
                                <div className='flex justify-end'>
                                    <p className="fs-12" ref={timerSectionRef}>{timer}</p>
                                </div>
                                <button type="submit" className="login-button fs-12 fs-sm-14 fs-md-16 mt-5 login-mobile-btn" onClick={e => handleVerifyOtp(e)}>
                                    {type === 'loginOTP' ? 'Login' : 'Verify OTP'}
                                </button>
                            </form>
                            {loader}
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <Navigate to={basePathAction(ENDPOINTS.LOGIN)} state={null} />
        )

    );
};

export default VerifyOtp;