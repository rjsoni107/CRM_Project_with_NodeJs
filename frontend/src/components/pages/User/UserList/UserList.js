import React, { useEffect, useState } from 'react';
import MUIDataTable from "mui-datatables";
import { useNavigate } from "react-router-dom";
import Base from '../../../../util/Base';
import { ENDPOINTS } from '../../../../utility/ApiEndpoints';
import UserListDTO from './UserListDTO';
import '../../../componentsCSS/dataTableStyle.css'
import Loader from '../../../loader/Loader';
import { SelectBox, TextInput } from '../../../formElements/FormElementsImport';
import ValidationHandler from '../../../../utility/ValidationHandler';
import DialogBox from '../../../dialogBox/DialogBox';
import ConfimationContent from '../../../dialogBox/ConfirmationContent';
function UserList() {
    const { fetchData, invokePaginationMethod, basePathAction } = Base();

    const navigate = useNavigate();
    const [showLoader, setShowLoader] = useState(false);
    const [state, setState] = useState({
        loginDetails: JSON.parse(localStorage.getItem('globalObj')),
        payload: {
            id: "",
            mobile: "",
            emailId: "",
            status: "All",
        },
        row: [],
        countPerPage: 0,
        start: 0,
        length: 10,
        forceUpdate: new Date(),
        status_list: [
            { value: 'ALL', label: 'ALL' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Blocked', label: 'Blocked' },
            { value: 'Suspended', label: 'Suspended' },
            { value: 'Blacklisted', label: 'Blacklisted' },
        ],
        status: [{ value: 'ALL', label: 'ALL' }],
    });

    const [dialogState, setDialogState] = useState({
        dialog: {
            isDialogOpen: false,
            dialogBoxType: 'confirmation',
            dialogBoxMsg: null,
            dialogFooter: null
        },
    });


    const { payload, countPerPage, length, row, status_list, status } = state;
    const { isDialogOpen, dialogBoxMsg, dialogBoxType, dialogFooter } = dialogState.dialog;
    const { fetchUsers, deleteUser } = UserListDTO(fetchData, setState, setShowLoader, state, setDialogState);
    const {
        inputChangeHandler,
        inputMessageHandler,
        validateInputHandler,
        removeLeadingEmailChar,
        allowOnlyOnce,
        selectBoxChangeHandler
    } = ValidationHandler();

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers(state);
    }, []);

    // Handler for Edit Button
    const editListHandler = (evt, userId) => {
        evt.preventDefault();
        setShowLoader(true);
        // Perform navigation after updating state
        navigate(`${basePathAction(ENDPOINTS.USER)}/${userId}`);
    };

    const columns = [
        { name: "id", label: "User ID", options: { filter: true, sort: false } },
        { name: "userType", label: "User Type", options: { filter: true, sort: false } },
        { name: "status", label: "User Status", options: { filter: true, sort: false } },
        { name: "firstName", label: "First Name", options: { filter: true, sort: false } },
        { name: "lastName", label: "Last Name", options: { filter: true, sort: false } },
        { name: "emailId", label: "Email", options: { filter: true, sort: false } },
        { name: "mobile", label: "Mobile", options: { filter: true, sort: false } },
        {
            name: "id", label: "Action", options: {
                customBodyRender: (value) => (
                    <div className='d-flex justify-content-center align-items-center gap-2'>
                        <button onClick={(e) => editListHandler(e, value)} className='btn btn-primary'>Edit</button>
                        <button onClick={(e) => deleteUser(value)} className='btn btn-danger'>Delete</button>
                    </div>
                ),
            },
        },
    ];

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

    const loader = showLoader && <Loader processing={true} approvalNotification={false} />;

    const handleBlur = (evt) => {
        validateInputHandler(evt);
    };
    return (
        <main>
            <div className="container mt-80">
                <div className="row form-group">
                    <div className="col-12 col-sm-6 col-md-3 mb-20">
                        <SelectBox
                            inputLable="Status"
                            selectpickerId="status"
                            name="status"
                            placeholder="Select Status"
                            value={status || ''}
                            options={status_list}
                            className="input-field is-required"
                            changeSelection={(that, name) => {
                                selectBoxChangeHandler(that, name, 'payload', setState);
                                inputMessageHandler(document.getElementById(name), 'HIDE', 'error');
                            }}
                        />
                    </div>
                    <div className="col-12 col-sm-6 col-md-3 mb-20">
                        <TextInput
                            label="Mobile"
                            name="mobile"
                            id="mobile"
                            placeholder="Enter Mobile Number"
                            value={payload.mobile || ''}
                            className="form-control input-field"
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

                    <div className="col-12 col-sm-6 col-md-3 mb-20">
                        <TextInput
                            label="Email"
                            name="emailId"
                            id="emailId"
                            placeholder="Enter Email ID"
                            value={payload.emailId || ''}
                            className="form-control input-field"
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
                    <div className='col-md-3 d-flex justify-content-center align-items-center'>
                        <button className="btn btn-primary" onClick={(e) => fetchUsers(state)}>Search</button>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12">
                        <div className="table table-striped table-bordered">
                            <MUIDataTable
                                data={row || []}
                                columns={columns}
                                options={{
                                    selectableRows: "none",
                                    filter: false,
                                    rowsPerPageOptions: [10, 25, 50, 100],
                                    download: false,
                                    print: false,
                                    search: false,
                                    responsive: "standard",
                                    viewColumns: false,
                                    count: countPerPage,
                                    serverSide: true,
                                    onChangePage: (page) => {
                                        invokePaginationMethod(page, length, 'onChangePage', setState, fetchUsers);
                                    },
                                    onChangeRowsPerPage: (rowsPerPage) => {
                                        invokePaginationMethod(0, rowsPerPage, 'onChangeRowsPerPage', setState, fetchUsers);
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
                {loader}
                {confirmationBox}
            </div>
        </main>
    );
}

export default UserList;