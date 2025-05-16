import { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
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
    const { fetchData, invokePaginationMethod, basePathAction, apiPathAction } = Base();

    const navigate = useNavigate();
    const [showLoader, setShowLoader] = useState(false);
    const [notification, setNotification] = useState(null);
    const [state, setState] = useState({
        loginDetails: JSON.parse(localStorage.getItem('globalObj')) || {},
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


    const { payload, countPerPage, length, row, status_list, status, loginDetails } = state;
    const { isDialogOpen, dialogBoxMsg, dialogBoxType, dialogFooter } = dialogState.dialog;
    const { fetchUsers, deleteUser, fetchNotifications } = UserListDTO(fetchData, setState, setShowLoader, state, setDialogState, apiPathAction, setNotification);
    const {
        inputChangeHandler,
        inputMessageHandler,
        validateInputHandler,
        removeLeadingEmailChar,
        allowOnlyOnce,
        selectBoxChangeHandler,
        isValueExist
    } = ValidationHandler();

    // Fetch users on component mount
    const userId = loginDetails.userId || null;

    useEffect(() => {
        if (!userId) {
            console.error('User not logged in, redirecting to login');
            navigate(basePathAction(ENDPOINTS.LOGIN));
            return;
        }
        fetchUsers(state);
        fetchNotifications(userId);

        let ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:3005');
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        const baseDelay = 5000;

        const reconnect = () => {
            if (reconnectAttempts >= maxReconnectAttempts) {
                console.error('Max reconnection attempts reached. Giving up.');
                setNotification('Unable to reconnect to WebSocket server. Please refresh the page.');
                return;
            }

            const delay = baseDelay * Math.pow(2, reconnectAttempts);
            console.log(`Reconnecting to WebSocket in ${delay / 1000} seconds... (Attempt ${reconnectAttempts + 1})`);

            setTimeout(() => {
                reconnectAttempts++;
                const newWs = new WebSocket(process.env.REACT_APP_WS_URL || 'wss://localhost:3005');

                newWs.onopen = () => {
                    if (newWs.readyState === WebSocket.OPEN) {
                        console.log('Connected to WebSocket server');
                        newWs.send(JSON.stringify({ userId }));
                        reconnectAttempts = 0;
                    } else {
                        console.warn('WebSocket is not in OPEN state:', newWs.readyState);
                    }
                };

                newWs.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'notification') {
                        setNotification(data.message);
                        setTimeout(() => setNotification(null), 5000);
                    }
                };

                newWs.onerror = (err) => {
                    console.error('WebSocket error:', err);
                    setNotification('Failed to connect to WebSocket server');
                };

                newWs.onclose = () => {
                    console.log('WebSocket connection closed');
                    reconnect();
                };

                ws = newWs;
            }, delay);
        };

        ws.onopen = () => {
            if (ws.readyState === WebSocket.OPEN) {
                console.log('Connected to WebSocket server');
                ws.send(JSON.stringify({ userId }));
            } else {
                console.warn('WebSocket is not in OPEN state:', ws.readyState);
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') {
                setNotification(data.message);
                // setTimeout(() => setNotification(null), 5000);
            }
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            setNotification('Failed to connect to WebSocket server');
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
            reconnect();
        };

        return () => {
            ws.close();
        };
    }, [userId, state.forceUpdate]);

    // Handler for Edit Button
    const editListHandler = (evt, userId) => {
        evt.preventDefault();
        setShowLoader(true);
        // Perform navigation after updating state
        navigate(`${basePathAction(ENDPOINTS.USER)}/${userId}`);
    };

    const handleUserSelect = (evt, receiverId) => {
        console.log(receiverId, 'receiverId');
        if (receiverId && loginDetails.userId) {
            evt.preventDefault();
            setShowLoader(true);
            // const chatId = `chat_${loginDetails.userId}${receiverId}`;
            const chatId = `chat_${Math.min(userId, receiverId)}${Math.max(userId, receiverId)}`;
            navigate(`${basePathAction(ENDPOINTS.CHAT)}/${chatId}/${loginDetails.userId}/${receiverId}`);
        } else {
            console.error('UserId or loginDetails.userId is undefined:', receiverId, loginDetails.userId);
        }
    };

    const columns = [
        { name: 'User ID', selector: row => row.userId, sortable: true },
        {
            name: 'Name',
            selector: row => `${isValueExist(row.firstName) ? row.firstName : ''} ${isValueExist(row.lastName) ? row.lastName : ''}`,
            sortable: true
        },
        { name: 'Email', selector: row => row.emailId, sortable: true },
        { name: 'Mobile', selector: row => row.mobile, sortable: true },
        {
            name: 'User Status', selector: row => row.status, sortable: true,
            conditionalCellStyles: [
                {
                    when: row => row.status === 'Active',
                    classNames: ['text-success'],
                },
                {
                    when: row => row.status === 'Inactive',
                    classNames: ['text-azure'],
                },
            ]
        },
        {
            name: 'Action',
            cell: row => (
                <div className='d-flex justify-content-center align-items-center gap-2'>
                    <button onClick={(e) => editListHandler(e, row.userId)} className='btn btn-primary' aria-label="Edit user">Edit</button>
                    <button onClick={(e) => deleteUser(row.userId)} className='btn btn-danger' aria-label="Delete user">Delete</button>
                    <button onClick={(e) => handleUserSelect(e, row.userId)} className='btn btn-primary' aria-label="Chat with user">Chat</button>
                </div>
            ),
            ignoreRowClick: true,
            allowoverflow: true,
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

                {notification && (
                    <div
                        style={{ color: 'blue', marginBottom: '10px', cursor: 'pointer' }}
                        onClick={() => {
                            const { chatId, receiverId } = notification;
                            navigate(`${basePathAction(ENDPOINTS.CHAT)}/${chatId}/${loginDetails.userId}/${receiverId}`);
                        }}
                    >
                        {notification.message}
                    </div>
                )}
                <div className="row">
                    <div className="col-md-12">
                        <div className="table-bordered">
                            <DataTable
                                title="User List"
                                data={row || []}
                                columns={columns}
                                pagination
                                highlightOnHover
                                responsive
                                paginationServer
                                paginationTotalRows={countPerPage}
                                onChangePage={(page) => {
                                    invokePaginationMethod(page, length, 'onChangePage', setState, fetchUsers);
                                }}
                                onChangeRowsPerPage={(rowsPerPage) => {
                                    invokePaginationMethod(0, rowsPerPage, 'onChangeRowsPerPage', setState, fetchUsers);
                                }}
                                progressPending={showLoader}
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