import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import Base from "../../util/Base";
import { Suspense } from "react";
import Loader from "../loader/Loader";
import RoutesConfig from "./RoutesConfig";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "./Layout";
import ErrorPage from "../pages/ErrorPage/ErrorPage";

function Main() {
    const { basePathAction, handleAutoLogout, apiPathAction } = Base();

    const currentUrl = window.location.href;
    const pagepath = currentUrl.slice(currentUrl.lastIndexOf("/") + 1);
    const excludePages = ["index", "login", "logout", "error", "oops"];

    if (excludePages.includes(pagepath)) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("globalObj");
    }

    handleAutoLogout(); // Call this function on page load or periodically
    setInterval(handleAutoLogout, 60000); // Check every 60 seconds

    return (
        <Suspense fallback={<Loader />}>
            <Routes>
                {RoutesConfig.map((route, index) => {
                    if (route.isProtected) {
                        return (
                            <Route
                                key={index}
                                path={basePathAction(route.path)}
                                element={
                                    <ProtectedRoute requiredPermission={route.path}>
                                        <Layout />
                                    </ProtectedRoute>}
                            >
                                {/* Nested route for protected routes */}
                                <Route index element={route.element} />
                            </Route>
                        );
                    }

                    // Render public routes directly
                    return (
                        <Route
                            key={index}
                            path={basePathAction(route.path)}
                            element={route.element}
                        />
                    );
                })}

                {/* Catch-All Route for Unknown Paths */}
                <Route path="*" element={<ErrorPage />} />
            </Routes>
        </Suspense>
    );
}

export default Main;