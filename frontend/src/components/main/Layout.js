import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Topbar from "../topbar/Topbar";
import SidebarPanal from "../sidebar/SidebarPanal";
const Layout = ({ forceUpdate }) => {
    const { userType, permissions } = JSON.parse(localStorage.getItem("globalObj") || "{}");

    console.log(permissions)
    const [isSidebarVisible, setSidebarVisible] = useState(true);

    const toggleSidebar = () => {
        setSidebarVisible((prevState) => !prevState);
    };

    const handleResize = () => {
        if (window.innerWidth <= 768) {
            setSidebarVisible(false);
        } else {
            setSidebarVisible(true);
        }
    };

    useEffect(() => {
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <div className="layout ">
            <SidebarPanal isSidebarVisible={isSidebarVisible} userType={userType} permissions={permissions} />
            <div className={`main-content ${isSidebarVisible ? "sidebar-open" : "sidebar-close"}`}>
                <Topbar toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} userType={userType}/>
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
