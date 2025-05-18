import React from "react";
import "./Dashboard.css";

const Dashboard = () => {
    return (
        <div className="dashboard-container">
            {/* Header Section */}
            <div className="dashboard-header mb-20">
                <h1 className="fs-24 fw-700">Dashboard</h1>
                <p className="fs-16 fw-400">Welcome to your dashboard! Here's an overview of your system.</p>
            </div>

            {/* Cards Section */}
            <div className="dashboard-cards">
                <div className="dashboard-card">
                    <h2 className="fs-20 fw-600">Users</h2>
                    <p className="fs-16 fw-400">Manage users and their roles.</p>
                </div>
                <div className="dashboard-card">
                    <h2 className="fs-20 fw-600">Friends</h2>
                    <p className="fs-16 fw-400">View detailed system reports.</p>
                </div>
                <div className="dashboard-card">
                    <h2 className="fs-20 fw-600">Settings</h2>
                    <p className="fs-16 fw-400">Configure system settings.</p>
                </div>
                <div className="dashboard-card">
                    <h2 className="fs-20 fw-600">Support</h2>
                    <p className="fs-16 fw-400">Get help and support.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;