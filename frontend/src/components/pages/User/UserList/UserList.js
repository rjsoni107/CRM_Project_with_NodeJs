import React, { useEffect, useState } from 'react';
import MUIDataTable from "mui-datatables";
import { useNavigate } from "react-router-dom";
import Base from '../../../../util/Base';
import { ENDPOINTS } from '../../../../utility/ApiEndpoints';
import UserListDTO from './UserListDTO';
import '../../../componentsCSS/dataTableStyle.css'
import Loader from '../../../loader/Loader';
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
    });

    const { payload, countPerPage, length, row } = state;
    const { fetchUsers, deleteUser } = UserListDTO(fetchData, setState, setShowLoader);

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers(state);
    }, []);

    // Handler for Edit Button
    const editListHandler = (evt, userId) => {
        evt.preventDefault();
        setShowLoader({ showLoader: true });
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
        { name: "company", label: "Company", options: { filter: true, sort: false } },
        { name: "website", label: "Website", options: { filter: true, sort: false } },
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

    const loader = showLoader && <Loader processing={true} approvalNotification={false} />;

    return (
        <div className="container">
            <div className="row">
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor='mobile'>Mobile</label>
                        <input
                            type="text"
                            id="mobile"
                            className="form-control"
                            placeholder="Enter mobile number"
                            onChange={(e) => setState({ ...state, payload: { ...state.payload, mobile: e.target.value } })}
                        />
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor='email'>Email</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control"
                            placeholder="Enter email address"
                            onChange={(e) => setState({ ...state, payload: { ...state.payload, emailId: e.target.value } })}
                        />
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor='status'>Status</label>
                        <select
                            className="form-control"
                            onChange={(e) => setState({ ...state, payload: { ...state.payload, status: e.target.value } })}
                        >
                            <option value="All">All</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className='col-md-3 d-flex justify-content-center align-items-center'>
                    <button className="btn btn-primary" onClick={() => { fetchUsers(payload); }}>Search</button>
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <div className="table table-striped table-bordered">
                        <MUIDataTable
                            data={row}
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
        </div>
    );
}

export default UserList;