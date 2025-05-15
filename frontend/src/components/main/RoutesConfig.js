import React from "react";
import { ENDPOINTS } from "../../utility/ApiEndpoints";
import Chat from "../pages/LiveChat/Chat";
const VerifyOtp = React.lazy(() => import("../pages/VerifyOtp/VerifyOtp"));
const AddUser = React.lazy(() => import("../pages/User/UserAdd/AddUser"));
const UserList = React.lazy(() => import("../pages/User/UserList/UserList"));
const UserEdit = React.lazy(() => import("../pages/User/UserEdit/UserEdit"));
const Profile = React.lazy(() => import("../pages/Profile/Profile"));
const Login = React.lazy(() => import("../pages/Login/Login"));
const ErrorPage = React.lazy(() => import("../pages/ErrorPage/ErrorPage"));
const ChangePin = React.lazy(() => import("../pages/ChangePin/ChangePin"));
const Signup = React.lazy(() => import("../pages/Signup/Signup"));
const Dashboard = React.lazy(() => import("../pages/Dashboard/Dashboard"));
// import Chat from "../pages/RealTimeChat/RealTimeChat";
const RoutesConfig = [
    // Public Routes
    {
        path: ENDPOINTS.OOPS,
        element: <ErrorPage />,
        isProtected: false,
    },
    {
        path: '/',
        element: <Login />,
        isProtected: false,
    },
    {
        path: ENDPOINTS.LOGIN,
        element: <Login />,
        isProtected: false,
    },
    {
        path: ENDPOINTS.INDEX,
        element: <Login />,
        isProtected: false,
    },
    {
        path: ENDPOINTS.SIGNUP,
        element: <Signup />,
        isProtected: false,
    },
    {
        path: `${ENDPOINTS.CHAT}/:id`,
        element: <Chat />,
        isProtected: false,
    },

    {
        path: ENDPOINTS.VERIFY_OTP,
        element: <VerifyOtp />,
        isProtected: false,
    },
    {
        path: ENDPOINTS.CHANGE_PIN,
        element: <ChangePin />,
        isProtected: false,
    },
    // {
    //     path: ENDPOINTS.CHAT,
    //     element: <Chat />,
    //     isProtected: false,
    // },

    // Protected Routes
    {
        path: ENDPOINTS.DASHBOARD,
        element: <Dashboard />,
        isProtected: true,
    },
    {
        path: ENDPOINTS.HOME,
        element: <Dashboard />,
        isProtected: true,
    },
    {
        path: ENDPOINTS.ADD_USER,
        element: <AddUser />,
        isProtected: true,
    },
    {
        path: ENDPOINTS.USER_LIST,
        element: <UserList />,
        isProtected: true,
    },
    {
        path: `${ENDPOINTS.USER}/:id`,
        element: <UserEdit />,
        isProtected: true,
    },
    {
        path: ENDPOINTS.PROFILE,
        element: <Profile />,
        isProtected: true,
    },
];

export default RoutesConfig;