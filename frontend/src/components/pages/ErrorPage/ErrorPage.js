import React from "react";
import { useNavigate } from "react-router-dom";
import "./ErrorPage.css";
import { ENDPOINTS } from "../../../utility/ApiEndpoints";
// import MainWrapper from "../../access/MainWrapper";
import Base from "../../../util/Base";
const { basePathAction } = Base();

const ErrorPage = (props) => {
    const navigate = useNavigate();

    const goHome = () => {
        navigate(basePathAction(ENDPOINTS.INDEX)); // Navigate back to the home page
    };

    return (
        // <MainWrapper maxWidth="max_width_550">
        // </MainWrapper>
            <div className="text-center">
                <div className="error-content">
                    <h1 className="error-title">404</h1>
                    <h2 className="error-message">Page Not Found</h2>
                    <p className="error-description">
                        Oops! The page you are looking for does not exist. It might have been removed or is temporarily unavailable.
                    </p>
                    <button className="lpay_button lpay_button-md lpay_button-primary fs-13" onClick={goHome}>
                        Go to Homepage
                    </button>
                </div>
            </div>
    );
};

export default ErrorPage;