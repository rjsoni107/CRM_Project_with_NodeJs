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
            mobile: "",
            pin: "",
            otp: '',
            type: 'loginPin'
        },
        redirect: null,
        redirectState: null,
    });

    const { fetchData, basePathAction, apiPathAction } = Base();
    const { validateInputHandler, inputChangeHandler, inputMessageHandler, validateFormHandler } = ValidationHandler();
    const { payload, redirect, redirectState } = state;

    const stateContext = {
        setError,
        fetchData,
        basePathAction,
        setState,
        state,
        setShowLoader,
        validateFormHandler,
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
                    <h1 className="fs-20 fs-sm-24 fs-md-36 fw-700">HELLO!</h1>
                    <p className="fs-12 fs-sm-14 fs-md-16 fw-400">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </div>
            </div>

            {/* Right Section with Login Form */}
            <div className="login-right">
                <div className="login-card p-20">
                    <div className='text-center'>
                        <h1 className="login-title fs-18 fs-sm-20 fs-md-24">Welcome Back</h1>
                        <p className="login-subtitle fs-12 fs-sm-14 fs-md-16 mb-15 mb-md-20">Please login to your account</p>
                        {error && <p className="error-message">{error}</p>}
                    </div>
                    <form className="form-section">
                        <div className="col-12 mb-15 mb-md-20">
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
                        <div className='d-flex justify-content-between'>
                            <p className='fs-10 fs-md-12 cursor-pointer' onClick={e => handleGenerateOtp(e, 'forgotPIN')}>Forgot PIN</p>
                            <p className='fs-10 fs-md-12 cursor-pointer' onClick={e => handleGenerateOtp(e, 'loginOTP')}>Login with OTP</p>
                        </div>
                        <button type="submit" className="login-button fs-12 fs-sm-14 fs-md-16" onClick={e => handleLogin(e)}> Login </button>
                        <div className='text-center fs-12 fs-sm-14 fs-md-14 mt-10'>
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