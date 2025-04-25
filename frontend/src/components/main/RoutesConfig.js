import Dashboard from "../pages/Dashboard/Dashboard";
import AddUser from "../pages/User/UserAdd/AddUser";
import UserList from "../pages/User/UserList/UserList";
import UserEdit from "../pages/User/UserEdit/UserEdit";
import Profile from "../pages/Profile/Profile";
import Login from "../pages/Login/Login";
import ErrorPage from "../pages/ErrorPage/ErrorPage";
import { ENDPOINTS } from "../../utility/ApiEndpoints";
import VerifyOtp from "../pages/VerifyOTP/VerifyOtp";

const RoutesConfig = [
    // Public Routes
    {
        path: ENDPOINTS.OOPS,
        element: <ErrorPage />,
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
        path: ENDPOINTS.VERIFY_OTP,
        element: <VerifyOtp />,
        isProtected: false,
    },

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