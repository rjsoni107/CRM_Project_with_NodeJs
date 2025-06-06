import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import logo from '../../../assets/logo.png'
import { disconnectSocket, initializeSocket } from '../../../lib/socket';
import Sidebar from './Sidebar'
import { logout, setOnlineUser, setUser } from '../../../redux/userSlice'
import Base from '../../../util/Base'
import { ENDPOINTS } from '../../../utility/ApiEndpoints'
import Loader from '../../loader/Loader'

const ChatSyncHome = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [showLoader, setShowLoader] = useState(false);

    const { fetchData, apiPathAction, basePathAction } = Base();

    // Fetch user details on mount
    const fetchUserDetails = async (propsState) => {
        setShowLoader(true);
        try {
            const actionName = ENDPOINTS.GET_USER_PROFILE_ACTION
            const responseJson = await fetchData('GET', apiPathAction(actionName));
            const { data } = responseJson || {};

            dispatch(setUser(data))

            if (data.logout) {
                dispatch(logout())
                navigate(basePathAction(ENDPOINTS.LOGIN))
            }
            setShowLoader(false);
        } catch (error) {
            dispatch(logout())
            navigate(basePathAction(ENDPOINTS.LOGIN))
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUserDetails()
        // eslint-disable-next-line
    }, [])

    // Socket connection management
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        let socketConnection = null;

        if (token) {
            socketConnection = initializeSocket(token);

            socketConnection.on('onlineUser', (data) => {
                dispatch(setOnlineUser(data));
            });

            // Optionally handle socket errors or disconnects
            socketConnection.on('auth-error', (data) => {
                dispatch(logout());
                navigate(basePathAction(ENDPOINTS.LOGIN));
            });
        } else {
            console.warn('No token found, skipping socket connection');
        }

        // Cleanup on unmount or token change
        return () => {
            disconnectSocket();
        };
    }, [dispatch, navigate]);

    const basePath = location.pathname === `/${ENDPOINTS.CHAT}`;

    return (
        <div className='grid lg:grid-cols-[300px,1fr] h-screen max-h-screen'>
            <section className={`bg-white ${!basePath && "hidden"} lg:block`}>
                <Sidebar setShowLoader={setShowLoader} />
            </section>

            {/* Message component */}
            <section className={` ${basePath && "hidden"}`}>
                <Outlet />
            </section>

            <div className={` bg-slate-200 justify-center items-center flex-col gap-2 hidden ${!basePath ? "hidden" : "lg:flex"}`}>
                <img src={`${window.basePath}/img/ChatSync_Logo.png`} width={250} alt='logo' />
                <p className='text-lg mt-2 text-slate-500'>Select user to send message</p>
            </div>
            {showLoader && <Loader processing={true} approvalNotification={false} />}
        </div>
    )
}

export default ChatSyncHome