import React from "react";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { Link, useLocation } from "react-router-dom";

import "./SidebarPanal.css";
import Base from "../../util/Base";
import menuConfig from "./menuConfig";

const menuItemStyles = {
    button: ({ active }) => ({
        backgroundColor: active ? "#eec" : undefined,
    }),
};

const SidebarPanal = ({ isSidebarVisible, permissions }) => {
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
        <div className="sidebar-rapper">
            <Sidebar collapsed={!isSidebarVisible} image={`${window.basePath}/img/sidebar-bg.jpg`}>
                <Menu className="pro-sidebar" menuItemStyles={menuItemStyles} >
                    {/* <MenuItem className="menu-toggle">Logo</MenuItem> */}
                    <div className="sidebar-logo">
                        <div className="d-flex justify-content-center">
                            <p>Logo</p>
                        </div>
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
                            >
                                {item.label}
                            </MenuItem>
                        );
                    })}
                </Menu>
            </Sidebar>
        </div>
    );
};

export default SidebarPanal;