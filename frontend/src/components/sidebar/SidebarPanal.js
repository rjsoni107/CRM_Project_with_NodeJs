import React from "react";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { Link, useLocation } from "react-router-dom";
import "./SidebarPanal.css";
import Base from "../../util/Base";
import menuConfig from "./menuConfig";
import { FaTimes } from "react-icons/fa";

const menuItemStyles = {
    button: ({ active }) => ({
        backgroundColor: active ? "#eec" : undefined,
    }),
};

const SidebarPanal = ({ isSidebarVisible, permissions, onClose }) => {
    const { basePathAction } = Base();
    const location = useLocation();

    // Filter menu items based on permissions
    const filteredMenuConfig = menuConfig.filter((item) => {
        if (item.children) {
            // Filter children based on permissions
            item.children = item.children.filter((child) => permissions.includes(child.path));
            return item.children.length > 0; // Include parent only if it has visible children
        }
        return permissions.includes(item.path);
    });

    return (
        <>
            <div
                className={`sidebar-overlay fixed inset-0 z-[9999] transition-opacity duration-300
                ${isSidebarVisible ? "block" : "hidden"}
                bg-black-tranparent bg-opacity-30 md:hidden`}
                onClick={onClose}
            />
            <div className={`sidebar-rapper fixed top-0 z-[10000] h-screen transition-all duration-300
                ${isSidebarVisible ? "left-0" : "-left-[230px]"}`}
            >
                <Sidebar collapsed={!isSidebarVisible} image={`${window.basePath}/img/sidebar-bg.jpg`}>
                    <Menu className="pro-sidebar" menuItemStyles={menuItemStyles} >
                        <div className="d-flex justify-content-between align-items-center">
                            <MenuItem className="menu-toggle cursor-none">ChatSync </MenuItem>
                            <button className="toggle-sidebar-btn block md:hidden" onClick={onClose}> <FaTimes /> </button>
                        </div>
                        {/* Render menu items dynamically */}
                        {filteredMenuConfig.map((item, index) => {
                            if (item.children) {
                                // Render SubMenu for items with children
                                return (
                                    <SubMenu key={index} icon={item.icon} label={item.label}>
                                        {item.children.map((child, childIndex) => (
                                            <MenuItem
                                                key={childIndex}
                                                active={location.pathname === basePathAction(child.path)}
                                                component={<Link to={`${basePathAction(child.path)}`} />}
                                                onClick={onClose}
                                            >
                                                {child.label}
                                            </MenuItem>
                                        ))}
                                    </SubMenu>
                                );
                            }

                            // Render MenuItem for items without children
                            return (
                                <MenuItem
                                    key={index}
                                    icon={item.icon}
                                    active={location.pathname === basePathAction(item.path)}
                                    component={<Link to={`${basePathAction(item.path)}`} />}
                                    onClick={onClose}
                                >
                                    {item.label}
                                </MenuItem>
                            );
                        })}
                    </Menu>
                </Sidebar>
            </div>
        </>
    );
};

export default SidebarPanal;