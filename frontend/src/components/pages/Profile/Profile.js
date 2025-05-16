import React from "react";
import "./Profile.css";
import { FaIdBadge, FaUser, FaEnvelope, FaMobileAlt } from "react-icons/fa";

const Profile = () => {
    const userData = JSON.parse(window.localStorage.getItem("globalObj")) || {};

    const ProfileItem = ({ label, value, Icon }) => {
        return (
            <div className="profile-item mb-10">
                 <div className="profile-label">
                 <Icon className="fs-15 text-davys-grey" />
                    <label className="text-davys-grey fw-bold mb-0">{label}:</label>
                </div>
                <p className="text-dark-charcoal fs-14 text-right">{value}</p>
            </div>
        );
    };

    return (
        <div className="profile-container">
            <div className="mb-20">
                <img
                    src={`${window.basePath}/img/profile.png`}
                    alt="Profile Avatar"
                    className="profile-avatar"
                />
                <h2 className="fs-24 fw-bold text-dark-charcoal">{userData.name}</h2>
            </div>
            <div className="">
                <ProfileItem label="User ID" value={userData.userId} Icon={FaIdBadge}/>
                <ProfileItem label="User Type" value={userData.userType} Icon={FaUser}/>
                <ProfileItem label="Email ID" value={userData.emailId} Icon={FaEnvelope}/>
                <ProfileItem label="Mobile No." value={userData.mobile} Icon={FaMobileAlt}/>
            </div>
        </div>
    );
};

export default Profile;