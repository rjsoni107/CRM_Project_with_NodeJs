import { ENDPOINTS } from "../../../../utility/ApiEndpoints";
import ValidationHandler from "../../../../utility/ValidationHandler";
import { useRef } from "react";

const AddUserDTO = ({setShowLoader, setDialogState, fetchData, basePathAction}) => {
    const { validateFormHandler } = ValidationHandler();
    const userAddDetailsRef = useRef(null);
    
    const submitHandler = (evt) => {
        evt.preventDefault();

        const that = evt.target;

        if (validateFormHandler(that)) {
            const userPayload = userAddDetailsRef.current.getPayload();
            const payload = { ...userPayload};
            const actionName = basePathAction(ENDPOINTS.ADD_USER_ACTION);

            setShowLoader(true);
            fetchData('POST', actionName, payload).then(responseJson => {
                const { responseStatus, responseMsg } = responseJson;
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
                                        window.location.reload();
                                    }}
                                >
                                    Close It
                                </button>
                            </>
                        )
                    },
                }));
                setShowLoader(false);
            });
        }
    }

    return { submitHandler, userAddDetailsRef };
};

export default AddUserDTO;