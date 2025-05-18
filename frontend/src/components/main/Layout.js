import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Topbar from "../topbar/Topbar";
import SidebarPanal from "../sidebar/SidebarPanal";
const Layout = ({ forceUpdate }) => {
    const { userType, permissions, name } = JSON.parse(localStorage.getItem("globalObj") || "{}");

    const [isSidebarVisible, setSidebarVisible] = useState(window.innerWidth > 768);

    const toggleSidebar = () => setSidebarVisible((prev) => !prev);
    const closeSidebar = () => setSidebarVisible(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) setSidebarVisible(false);
            else setSidebarVisible(true);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="layout h-full">
            <SidebarPanal isSidebarVisible={isSidebarVisible} userType={userType} permissions={permissions} onClose={closeSidebar}/>
            <div className={`main-content ${isSidebarVisible ? "sidebar-open" : "sidebar-close"}`}>
                <Topbar toggleSidebar={toggleSidebar} isSidebarVisible={isSidebarVisible} userType={userType} name={name} />
                <div className="pt-[60px] h-full flex flex-col">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;
