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

const Signup = () => {
    const [error, setError] = useState(null);
    const [showLoader, setShowLoader] = useState(false);
    const [redirect, setRedirect] = useState(false)
    const [state, setState] = useState({
        payload: {
            businessName: '',
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
    const { fetchData, basePathAction } = Base();
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
        setDialogState
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
                    <h1 className="fs-24 fw-700">Come join us!</h1>
                    <p className="fs-16 fw-400">Welcome back! We are so happy to have you here. It's great to see you again. We hope you had a safe and enjoyable time away</p>
                </div>
            </div>

            {/* Right Section with Login Form */}
            <div className="login-right">
                <div className="login-card">
                    <div className='text-center'>
                        <h1 className="login-title">Welcome Back</h1>
                        <p className="login-subtitle">Please signup your account</p>
                        {error && <p className="error-message">{error}</p>}
                    </div>
                    <form className="form-section">
                        <div className="col-12 mb-20">
                            <TextInput
                                label="businessName"
                                name="businessName"
                                id="businessName"
                                placeholder="Enter Business Name"
                                value={payload.businessName || ''}
                                className="form-control input-field"
                                isRequired={true}
                                maxLength={200}
                                onChange={evt => {
                                    inputChangeHandler(evt, setState);
                                    inputMessageHandler(evt, 'HIDE', 'error');
                                }}
                                onBlur={handleBlur}
                                dataType="ALPHA_NUMERIC_SPACE"
                            />
                        </div>
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
                        <div className="col-12 mb-20">
                            <TextInput
                                label="Email"
                                name="emailId"
                                id="emailId"
                                placeholder="Enter Email ID"
                                value={payload.emailId || ''}
                                className="form-control input-field"
                                isRequired={true}
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
                        <div className="col-12 mb-20">
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
                                autoComplete="new-password"
                                onChange={evt => {
                                    inputChangeHandler(evt, setState);
                                    inputMessageHandler(evt, 'HIDE', 'error');
                                }}
                                onBlur={handleBlur}
                                dataType="NUMBER"
                                dataValidation="PIN"
                            />
                        </div>
                        <div className="col-12 mb-20">
                            <TextInput
                                label="Confirm PIN"
                                type="password"
                                name="confirmPin"
                                id="confirmPin"
                                placeholder="Confirm PIN"
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
                        <button type="submit" className="login-button" onClick={e => submitHandler(e)}>Sign Up</button>
                        <div className='text-center fs-14 mt-10'>
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