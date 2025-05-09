import { redirect } from "react-router-dom";
import { ENDPOINTS } from "../../../utility/ApiEndpoints";

const SignupDTO = ({ state, setState, setShowLoader, fetchData, validateFormHandler, basePathAction, setError, setRedirect, setDialogState, apiPathAction }) => {

    const submitHandler = async (evt) => {
        evt.preventDefault()
        const that = evt.target;

        if (validateFormHandler(that)) {
            const payload = state.payload;
            const actionName = apiPathAction(ENDPOINTS.SIGNUP_ACTION);
            setShowLoader(true)
            try {
                const responseJson = await fetchData('POST', actionName, payload);
                const { responseMsg, responseStatus } = responseJson;

                if (responseStatus === 'SUCCESS') {
                    setDialogState(prevState => ({
                        ...prevState,
                        dialog: {
                            ...prevState.dialog,
                            dialogBoxType: responseStatus === "SUCCESS" ? 'success' : 'error',
                            dialogBoxMsg: <h5>{responseMsg}</h5>,
                            isDialogOpen: true,
                            dialogFooter: (
                                <>
                                    <button className='btn btn-primary'
                                        onClick={(e) => {
                                            setDialogState({ dialog: { isDialogOpen: false } });
                                            if (responseStatus === "SUCCESS") setRedirect(basePathAction(ENDPOINTS.LOGIN));
                                        }}
                                    >
                                        Ok
                                    </button>
                                </>
                            )
                        },
                    }));
                } else {
                    setError(responseMsg)
                }

            } catch (error) {
                console.error("Error during login:", error);
            } finally {
                setShowLoader(false)
            }
        }
    };

    return { submitHandler };
}

export default SignupDTO;