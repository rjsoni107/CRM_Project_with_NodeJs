import React, { useState } from "react";
import "./topbar.css";
import Base from "../../util/Base";
import Loader from "../loader/Loader";

const Topbar = ({ toggleSidebar, isSidebarVisible, userType }) => {
    const [showLoader, setShowLoader] = useState(false);
    const { handleLogout } = Base();

    const loader = showLoader && <Loader processing={true} approvalNotification={false} />;

    const formattedUserType = userType.charAt(0).toUpperCase() + userType.slice(1).toLowerCase();
    return (
        <div className={`topbar ${isSidebarVisible ? 'w-83' : 'w-94'}`}>
            <button className="toggle-sidebar-btn" onClick={toggleSidebar}> ☰ </button>
            <h1 className="topbar-title">Welcome {formattedUserType} CRM</h1>
            <button className="logout-btn" onClick={e => handleLogout(setShowLoader)}> Logout </button>
            {loader}
        </div>
    );
};

export default Topbar;