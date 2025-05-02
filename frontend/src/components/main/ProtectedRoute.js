import React from "react";
import { Navigate } from "react-router-dom";
import Base from "../../util/Base";
import { ENDPOINTS } from "../../utility/ApiEndpoints";

const ProtectedRoute = ({ children, requiredPermission }) => {
    const { basePathAction } = Base();
    const isAuthenticated = !!localStorage.getItem("authToken");
    const permissions = JSON.parse(localStorage.getItem("globalObj"))?.permissions || [];

    // Check if the user is authenticated
    if (!isAuthenticated) return <Navigate to={basePathAction(ENDPOINTS.LOGIN)} replace />;                                                                                                                                                                                                                                                                                                                                                       

    // Check if the user has the required permission
    if (requiredPermission && !permissions.includes(requiredPermission)) {
        console.error('Permisson not granted')
        return <Navigate to={basePathAction(ENDPOINTS.LOGIN)} replace />;
    }

    return children;
};

export default ProtectedRoute;