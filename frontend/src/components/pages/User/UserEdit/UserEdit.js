import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Base from '../../../../util/Base';
import UserEditDTO from './UserEditDTO';
import Heading from '../../../heading/Heading';
import Loader from '../../../loader/Loader';
import EditUserDetails from './EditUserDetails';
import DialogBox from '../../../dialogBox/DialogBox';
import ConfimationContent from '../../../dialogBox/ConfirmationContent';
const UserEdit = () => {
    const { id } = useParams();
    const [userDetail, setUserDetails] = useState(null);
    const [showLoader, setShowLoader] = useState(false);

    const [dialogState, setDialogState] = useState({
        dialog: {
            isDialogOpen: false,
            dialogBoxType: 'confirmation',
            dialogBoxMsg: null,
            dialogFooter: null
        },
    });
    const { fetchData, basePathAction, apiPathAction } = Base();
    const userContext = { setShowLoader, setUserDetails, id, setDialogState, fetchData, basePathAction, apiPathAction };
    const { execute, submitHandler, userDetailsRef } = UserEditDTO(userContext);
    const { isDialogOpen, dialogBoxMsg, dialogBoxType, dialogFooter } = dialogState.dialog;

    useEffect(() => {
        execute()
    }, []);

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
        <main>
            {userDetail &&
                <div className={"container mt-4"}>
                    <div className="form-section">
                        <Heading
                            title="Edit User"
                            headingClass=""
                            icon="true"
                            customClass="w-full"
                        />
                        <EditUserDetails ref={userDetailsRef} data={userDetail} setShowLoader={setShowLoader} />

                        <div className='flex justify-center my-4'>
                            <button className='btn btn-primary' onClick={evt => submitHandler(evt)}>Save</button>
                        </div>
                    </div>
                </div>
            }
            {showLoader && <Loader processing={true} approvalNotification={false} />}
            {confirmationBox}
        </main>
    );
}
export default UserEdit;