import React, { useState } from 'react';
import LoginDTO from './LoginDTO';
import Base from '../../../util/Base';
import { Navigate } from 'react-router-dom';
import Loader from '../../loader/Loader';
import './login.css';
import { TextInput } from '../../formElements/FormElementsImport';
import ValidationHandler from '../../../utility/ValidationHandler';

const Login = () => {
    const [error, setError] = useState(null);
    const [showLoader, setShowLoader] = useState(false);
    const [state, setState] = useState({
        payload: {
            mobile: "",
            pin: "",
            otp: '',
            type: 'loginPin'
        },
        redirect: null,
        redirectState: null,
    });

    const { fetchData, basePathAction } = Base();
    const { validateInputHandler, inputChangeHandler, inputMessageHandler, validateFormHandler } = ValidationHandler();
    const { payload, redirect, redirectState } = state;

    const stateContext = {
        setError,
        fetchData,
        basePathAction,
        setState,
        state,
        setShowLoader,
        validateFormHandler
    }

    const { handleLogin, handleGenerateOtp } = LoginDTO(stateContext);

    if (redirect) return <Navigate to={redirect} state={redirectState} />;

    const loader = showLoader && <Loader processing={true} approvalNotification={false} />;

    const handleBlur = (evt) => {
        validateInputHandler(evt);
    };

    return (
        <div>
            <div className="login-wrapper">
                {/* Left Section with Background */}
                <div className="login-left">
                    <div className="login-left-content">
                        <h1 className="fs-24 fw-700">HELLO!</h1>
                        <p className="fs-16 fw-400">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                    </div>
                </div>

                {/* Right Section with Login Form */}
                <div className="login-right">
                    <div className="login-card">
                        <div className='text-center'>
                            <h1 className="login-title">Welcome Back</h1>
                            <p className="login-subtitle">Please login to your account</p>
                            {error && <p className="error-message">{error}</p>}
                        </div>
                        <form className="form-section">
                            <div className="col-12 mb-20">
                                <TextInput
                                    label="Mobile"
                                    name="mobile"
                                    id="mobile"
                                    placeholder="Enter Mobile Number"
                                    value={payload.mobile || ''}
                                    className="form-control input-field"
                                    isRequired={true}
                                    maxLength={10}
                                    onChange={evt => {
                                        inputChangeHandler(evt, setState);
                                        inputMessageHandler(evt, 'HIDE', 'error');
                                    }}
                                    onBlur={handleBlur}
                                    dataType="MOBILE"
                                    dataValidation="MOBILE"
                                />
                            </div>
                            <div className="col-12 mb-10">
                                <TextInput
                                    label="PIN"
                                    name="pin"
                                    type="password"
                                    id="pin"
                                    placeholder="Enter PIN"
                                    value={payload.pin || ''}
                                    className="form-control input-field"
                                    isRequired={true}
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
                            <div className='d-flex justify-content-between'>
                                <p className='fs-12 cursor-pointer' onClick={e => handleGenerateOtp(e, 'forgotPIN')}>Forgot PIN</p>
                                <p className='fs-12 cursor-pointer' onClick={e => handleGenerateOtp(e, 'loginOTP')}>Login with OTP</p>
                            </div>
                            <button type="submit" className="login-button" onClick={e => handleLogin(e)}>
                                Next →
                            </button>
                            <p className="create-account">Create account</p>
                        </form>
                        {loader}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;