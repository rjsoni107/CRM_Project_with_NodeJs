import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import Base from "../../util/Base";
import { Suspense } from "react";
import Loader from "../loader/Loader";
import RoutesConfig from "./RoutesConfig";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "./Layout";
import ErrorPage from "../pages/ErrorPage/ErrorPage";
import ErrorBoundary from "./ErrorBoundary";
import { logout, setToken } from "../../redux/userSlice";
import { useDispatch } from "react-redux";

function Main() {
    const { basePathAction, handleAutoLogout } = Base();
    const dispatch = useDispatch()

    const currentUrl = window.location.href;
    const pagepath = currentUrl.slice(currentUrl.lastIndexOf("/") + 1);
    const excludePages = ["index", "login", "logout", "error", "oops"];

    if (excludePages.includes(pagepath)) {
        localStorage.clear()
        dispatch(logout())
        dispatch(setToken())
    }

    handleAutoLogout(); // Call this function on page load or periodically
    setInterval(handleAutoLogout, 60000); // Check every 60 seconds

    return (
        <ErrorBoundary>
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
                                    {route.children && route.children.map((child, childIndex) => (
                                        <Route
                                            key={`${index}-${childIndex}`}
                                            path={child.path}
                                            element={child.element}
                                        />
                                    ))}
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
        </ErrorBoundary>
    );
}

export default Main;