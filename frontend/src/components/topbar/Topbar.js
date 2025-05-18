import React, { useState } from "react";
import "./topbar.css";
import Base from "../../util/Base";
import Loader from "../loader/Loader";

const Topbar = ({ toggleSidebar, isSidebarVisible, userType, name }) => {
    const [showLoader, setShowLoader] = useState(false);
    const { handleLogout } = Base();

    const loader = showLoader && <Loader processing={true} approvalNotification={false} />;

    return (
        <div className={`topbar ${isSidebarVisible ? 'w-83' : 'w-100'}`}>
            <button className="toggle-sidebar-btn" onClick={toggleSidebar}> ☰ </button>
            <h1 className="topbar-title">Welcome {name} </h1>
            <button className="logout-btn" onClick={e => handleLogout(setShowLoader)}> Logout </button>
            {loader}
        </div>
    );
};

export default Topbar;