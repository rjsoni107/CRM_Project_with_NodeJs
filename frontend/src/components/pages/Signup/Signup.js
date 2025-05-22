import { useState } from "react";
import Loader from "../../loader/Loader";
import SignupDTO from "./SignupDTO";
import Base from "../../../util/Base";
import ValidationHandler from "../../../utility/ValidationHandler";
import { TextInput } from "../../formElements/FormElementsImport";
import { Navigate } from "react-router-dom";
import { ENDPOINTS } from "../../../utility/ApiEndpoints";
import DialogBox from "../../dialogBox/DialogBox";
import ConfimationContent from "../../dialogBox/ConfirmationContent";
import '../Login/login.css'

const Signup = () => {
    const [error, setError] = useState(null);
    const [showLoader, setShowLoader] = useState(false);
    const [redirect, setRedirect] = useState(false)
    const [state, setState] = useState({
        payload: {
            name: '',
            mobile: '',
            emailId: '',
            pin: '',
            confirmPin: ''
        }
    })
    const [dialogState, setDialogState] = useState({
        dialog: {
            isDialogOpen: false,
            dialogBoxType: 'confirmation',
            dialogBoxMsg: null,
            dialogFooter: null
        },
    });
    const { payload } = state;
    const { fetchData, basePathAction, apiPathAction } = Base();
    const {
        validateFormHandler,
        inputChangeHandler,
        inputMessageHandler,
        validateInputHandler,
        removeLeadingEmailChar,
        allowOnlyOnce
    } = ValidationHandler();

    const stateContext = {
        state,
        setState,
        setShowLoader,
        fetchData,
        validateFormHandler,
        basePathAction,
        setError,
        setRedirect,
        setDialogState,
        apiPathAction
    }
    const { submitHandler } = SignupDTO(stateContext);
    const handleBlur = (evt) => {
        validateInputHandler(evt)
    }

    const loader = showLoader && <Loader processing={true} approvalNotification={false} />;
    if (redirect) return <Navigate to={redirect} />;

    const { isDialogOpen, dialogBoxMsg, dialogBoxType, dialogFooter } = dialogState.dialog;

    let confirmationBox = null;
    if (isDialogOpen) {
        confirmationBox = <DialogBox
            onClose={(e) => setDialogState({ dialog: { isDialogOpen: false } })}
            open={isDialogOpen}
            content={<ConfimationContent dialogType={dialogBoxType} content={dialogBoxMsg} />}
            isFooter={true}
            footerContent={
                <div className="content_buttonWrapper">
                    {dialogFooter}
                </div>
            }
        />
    }
    const loginHandler = () => {
        setRedirect(basePathAction(ENDPOINTS.LOGIN))
    }
    return (
        <div className="login-wrapper">
            {/* Left Section with Background */}
            <div className="login-left">
                <div className="login-left-content">
                    <div className='flex justify-center login-mobile-logo-container'>
                        <img src={`${window.basePath}/img/logo192.png`} alt="ChatSync-Logo" className='md:h-[120px] h-[65px] login-mobile-logo' />
                    </div>
                    <h1 className="fs-20 fs-sm-24 fs-md-36 fw-700">Come join us!</h1>
                    <p className="fs-12 fs-sm-14 fs-md-16 fw-400 mb-5">Welcome back! We are so happy to have you here. It's great to see you again.</p>
                </div>
            </div>

            {/* Right Section with Login Form */}
            <div className="login-right">
                <div className="login-card p-20">
                    <div className='text-center'>
                        <h1 className="login-title fs-18 fs-sm-20 fs-md-24 mt-5 md:mt-0 sm:mt-0">Welcome Back</h1>
                        <p className="login-subtitle fs-12 fs-sm-14 fs-md-16 mb-15 md:mb-5">Please signup your account</p>
                        {error && <p className="error-message">{error}</p>}
                    </div>
                    <form className="form-section">
                        <div className="grid grid-cols-1">
                            <TextInput
                                wrapper="mb-4"
                                label="Name"
                                name="name"
                                id="name"
                                placeholder="Enter Your Name"
                                value={payload.name || ''}
                                className="form-control input-field"
                                isRequired={true}
                                maxLength={100}
                                onChange={evt => {
                                    inputChangeHandler(evt, setState);
                                    inputMessageHandler(evt, 'HIDE', 'error');
                                }}
                                onBlur={handleBlur}
                                dataType="ALPHA_SPACE"
                            />

                            <TextInput
                                wrapper="mb-4"
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
                            <TextInput
                                wrapper="mb-4"
                                label="Email ID"
                                sublable="true"
                                name="emailId"
                                id="emailId"
                                placeholder="Enter Email ID"
                                value={payload.emailId || ''}
                                className="form-control input-field"
                                autoComplete="off"
                                maxLength={100}
                                onInput={e => {
                                    inputChangeHandler(e, setState);
                                    removeLeadingEmailChar(e);
                                    inputMessageHandler(e, 'HIDE', 'error');
                                }}
                                onKeyDown={e => allowOnlyOnce({ event: e, allowedChar: '@', keyCode: 50 })}
                                onBlur={handleBlur}
                                dataType="EMAIL"
                                dataValidation="EMAIL"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <TextInput
                                wrapper="mb-4"
                                label="PIN"
                                name="pin"
                                type="password"
                                id="pin"
                                placeholder="Enter 6 Digit PIN"
                                value={payload.pin || ''}
                                className="form-control input-field"
                                isRequired={true}
                                maxLength={6}
                                autoComplete="new-password"
                                onChange={evt => {
                                    inputChangeHandler(evt, setState);
                                    inputMessageHandler(evt, 'HIDE', 'error');
                                }}
                                onBlur={handleBlur}
                                dataType="NUMBER"
                                dataValidation="PIN"
                            />
                            <TextInput
                                label="Confirm PIN"
                                type="password"
                                name="confirmPin"
                                id="confirmPin"
                                placeholder=" Enter Confirm PIN"
                                value={payload.confirmPin || ''}
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
                        <button type="submit" className="login-button fs-12 fs-sm-14 fs-md-16 mt-5 login-mobile-btn" onClick={e => submitHandler(e)}>Sign Up</button>
                        <div className='text-center fs-12 fs-sm-14 fs-md-14 mt-3'>
                            <span>Already have an account?</span>
                            <span className="text-azure cursor-pointer" onClick={e => loginHandler(e)}> Login</span>
                        </div>
                    </form>
                    {loader}
                    {confirmationBox}
                </div>
            </div>
        </div>
    )
}

export default Signup;