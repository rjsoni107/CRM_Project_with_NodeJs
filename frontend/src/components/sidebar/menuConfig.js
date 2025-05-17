import { FaChartPie, FaUser, FaAddressBook, FaFile } from "react-icons/fa";
import { ENDPOINTS } from "../../utility/ApiEndpoints";
import Chat from "../pages/LiveChat/Chat";

// Centralized menu configuration
const menuConfig = [
    {
        label: "Dashboard",
        path: ENDPOINTS.DASHBOARD,
        icon: <FaChartPie />,
    },
    {
        label: "Report",
        icon: <FaFile />,
        children: [
            { label: "Sale Report", path: ENDPOINTS.ADD_USER_ACTION },
            { label: "Failed Report", path: ENDPOINTS.USER_LIST },
        ],
    },
    {
        label: "User",
        icon: <FaUser />,
        children: [
            { label: "Add User", path: ENDPOINTS.ADD_USER },
            { label: "User List", path: ENDPOINTS.USER_LIST },
        ],
    },
    {
        label: "Friends",
        icon: <FaUser />,
        children: [
            { label: "Friends List", path: ENDPOINTS.FRIENDS_LIST },
        ],
    },
    {
        label: "Profile",
        path: ENDPOINTS.PROFILE,
        icon: <FaAddressBook />,
    },
];

export default menuConfig;