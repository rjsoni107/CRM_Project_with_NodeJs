import React, { useState } from 'react';
import LoginDTO from './LoginDTO';
import Base from '../../../util/Base';
import { Navigate } from 'react-router-dom';
import Loader from '../../loader/Loader';
import './login.css';
import { TextInput } from '../../formElements/FormElementsImport';
import ValidationHandler from '../../../utility/ValidationHandler';
import { ENDPOINTS } from '../../../utility/ApiEndpoints';

const Login = () => {
    const [error, setError] = useState(null);
    const [showLoader, setShowLoader] = useState(false);
    const [state, setState] = useState({
        payload: {
            userName: "",
            pin: "",
            otp: '',
            type: 'loginPin'
        },
        redirect: null,
        redirectState: null,
    });

    const { fetchData, basePathAction, apiPathAction } = Base();
    const { validateInputHandler, inputChangeHandler, inputMessageHandler } = ValidationHandler();
    const { payload, redirect, redirectState } = state;

    const stateContext = {
        setError,
        fetchData,
        basePathAction,
        setState,
        state,
        setShowLoader,
        apiPathAction,
    }

    const { handleLogin, handleGenerateOtp } = LoginDTO(stateContext);

    if (redirect) return <Navigate to={redirect} state={redirectState} />;

    const loader = showLoader && <Loader processing={true} approvalNotification={false} />;

    const handleBlur = (evt) => {
        validateInputHandler(evt);
    };

    const signupHandler = () => {
        setShowLoader(true)
        setState(prevState => ({
            ...prevState,
            redirect: basePathAction(ENDPOINTS.SIGNUP)
        }))
    }

    return (
        <div className="login-wrapper">
            {/* Left Section with Background */}
            <div className="login-left">
                <div className="login-left-content">
                    <div className='flex justify-center login-mobile-logo-container'>
                        <img src={`${window.basePath}/img/logo192.png`} alt="ChatSync-Logo" className='md:h-[120px] h-[65px] login-mobile-logo' />
                    </div>
                    <img src={`${window.basePath}/img/ChatSync.png`} alt="ChatSync-Logo" className='md:h-[120px] h-[65px] mb-4' />
                </div>
            </div>

            {/* Right Section with Login Form */}
            <div className="login-right">
                <div className="login-card p-20">
                    <div className='text-center'>
                        <h1 className="login-title fs-18 fs-sm-20 fs-md-24 mt-5 md:mt-0 sm:mt-0">Welcome Back</h1>
                        <p className="login-subtitle fs-12 fs-sm-14 fs-md-16 mb-15 md:mb-5">Please login to your account</p>
                        {error && <p className="error-message">{error}</p>}
                    </div>
                    <form className="form-section">
                        <div className="w-full mb-15 mb-md-20">
                            <TextInput
                                label="User Name"
                                name="userName"
                                id="userName"
                                placeholder="Enter Mobile Number or Username"
                                value={payload.userName || ''}
                                className="form-control input-field"
                                isRequired={true}
                                maxLength={20}
                                onChange={evt => {
                                    inputChangeHandler(evt, setState);
                                    inputMessageHandler(evt, 'HIDE', 'error');
                                }}
                                onBlur={handleBlur}
                                dataType="ALPHA_NUMERIC_SPACIAL"
                                dataValidation="USER_NAME"
                            />
                        </div>
                        <div className="w-full mb-3">
                            <TextInput
                                label="PIN"
                                name="pin"
                                type="password"
                                id="pin"
                                placeholder="Enter PIN"
                                value={payload.pin || ''}
                                className="form-control input-field"
                                isRequired={true}
                                autoComplete="new-password"
                                maxLength={6}
                                onChange={evt => {
                                    inputChangeHandler(evt, setState);
                                    inputMessageHandler(evt, 'HIDE', 'error');
                                }}
                                onBlur={handleBlur}
                                dataType="NUMBER"
                                dataValidation="PIN"
                            />
                        </div>
                        <div className='flex justify-between'>
                            <p className='fs-11 fs-md-12 cursor-pointer' onClick={e => handleGenerateOtp(e, 'forgotPIN')}>Forgot PIN</p>
                            <p className='fs-11 fs-md-12 cursor-pointer' onClick={e => handleGenerateOtp(e, 'loginOTP')}>Login with OTP</p>
                        </div>
                        <button type="submit" className="login-button fs-12 fs-sm-14 fs-md-16 mt-5 login-mobile-btn" onClick={e => handleLogin(e)}> Login </button>
                        <div className='text-center fs-12 fs-sm-14 fs-md-14 mt-3'>
                            <span>Don't have an account</span>
                            <span className="text-azure cursor-pointer" onClick={e => signupHandler(e)}> Singup</span>
                        </div>
                    </form>
                    {loader}
                </div>
            </div>
        </div>
    );
};

export default Login;