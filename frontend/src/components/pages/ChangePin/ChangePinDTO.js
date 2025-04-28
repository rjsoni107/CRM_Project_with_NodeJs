import { ENDPOINTS } from "../../../utility/ApiEndpoints";

const ChangePinDTO = ({ setError, setState, state, setShowLoader, validateFormHandler, fetchData, basePathAction, setDialogState }) => {
    // const { pin, confirmPin } = state.payload;

    const handleChangePin = async (event) => {
        event.preventDefault();
        const that = event.target;

        if (validateFormHandler(that)) {
            const payload = state.payload
            const actionName = basePathAction(ENDPOINTS.CHANGE_PIN_ACTION);
            setShowLoader(true);
            try {
                const response = await fetchData("POST", actionName, payload);
                const { responseMsg, responseStatus } = response;

                if (response && responseStatus === 'SUCCESS') {
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
                                            window.location.href = basePathAction(ENDPOINTS.LOGIN);
                                        }}>
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
                console.error(error);
                setError(error);
            } finally {
                setShowLoader(false);
            }
        }

    }

    return { handleChangePin };
}

export default ChangePinDTO;