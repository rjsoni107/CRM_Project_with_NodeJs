import { useState } from "react";
import Base from "../../../util/Base";
import { TextInput } from "../../formElements/FormElementsImport";
import Loader from "../../loader/Loader";
import ChangePinDTO from "./ChangePinDTO"
import ValidationHandler from "../../../utility/ValidationHandler";
import DialogBox from "../../dialogBox/DialogBox";
import ConfimationContent from "../../dialogBox/ConfirmationContent";
import { useLocation } from "react-router-dom";
import '../Login/login.css'

const ChangePin = () => {
    const location = useLocation();
    const { mobile } = location.state.userDetails || {};
    const [error, setError] = useState(null);
    const [showLoader, setShowLoader] = useState(false)
    const [state, setState] = useState({
        payload: {
            pin: "",
            confirmPin: "",
            mobile: mobile || ""
        }
    });
    const [dialogState, setDialogState] = useState({
        dialog: {
            isDialogOpen: false,
            dialogBoxType: 'confirmation',
            dialogBoxMsg: null,
            dialogFooter: null
        },
    });

    const { payload } = state;
    const { isDialogOpen, dialogBoxMsg, dialogBoxType, dialogFooter } = dialogState.dialog;

    const { inputChangeHandler, inputMessageHandler, validateInputHandler, validateFormHandler } = ValidationHandler();
    const { fetchData, basePathAction, apiPathAction } = Base();

    const stateContext = {
        setError,
        setState,
        state,
        setShowLoader,
        validateFormHandler,
        fetchData,
        basePathAction,
        setDialogState,
        apiPathAction,
    }
    const { handleChangePin } = ChangePinDTO(stateContext);

    const handleBlur = (evt) => {
        validateInputHandler(evt);
    }

    const loader = showLoader && <Loader processing={true} approvalNotification={false} />;

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
    return (
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
                        <div className='text-center'>
                            <h1 className="login-title fs-18 fs-sm-20 fs-md-24 mt-5 md:mt-0 sm:mt-0">Create New Password</h1>
                            <p className="login-subtitle fs-12 fs-sm-14 fs-md-16 mb-15 md:mb-5">Enter a new Password below to change your Password</p>
                            {error && <p className="error-message">{error}</p>}
                        </div>
                        <form className="form-section">
                            <div className="w-full mb-20">
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
                            <div className="w-full mb-20">
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
                            <button type="submit" className="login-button fs-12 fs-sm-14 fs-md-16 login-mobile-btn" onClick={e => handleChangePin(e)}>
                                Change Password
                            </button>
                        </form>
                        {loader}
                        {confirmationBox}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChangePin;