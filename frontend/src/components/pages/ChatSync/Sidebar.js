import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom';
import { BiLogOut } from "react-icons/bi";
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowUpLeft } from "react-icons/fi";
import SearchUser from './SearchUser';
import { FaImage, FaVideo } from "react-icons/fa6";
import { getSocket } from '../../../lib/socket';
import { logout } from '../../../redux/userSlice';
import Avatar from '../../helperComponent/Avatar';
import EditUserProfile from './EditUserProfile';
import { ENDPOINTS } from '../../../utility/ApiEndpoints';
import { IoPersonAddSharp } from "react-icons/io5";
import Base from '../../../util/Base';
import { TbDots } from "react-icons/tb";
import Divider from '../../helperComponent/Divider';

const Sidebar = ({ setShowLoader }) => {
    const user = useSelector(state => state?.user)
    const [editUserOpen, setEditUserOpen] = useState(false)
    const [allUser, setAllUser] = useState([])
    const [openSearchUser, setOpenSearchUser] = useState(false)
    const socketConnection = getSocket()
    const dispatch = useDispatch()
    const { handleLogout, basePathAction } = Base();
    console.log(allUser)

    useEffect(() => {
        if (!socketConnection || !user?._id) return;

        // Request sidebar data
        socketConnection.emit('sidebar', user._id);

        // Handler for conversation updates
        const handleConversation = (data) => {
            const conversationUserData = data.map((conversationUser) => {
                // Determine the other user in the conversation
                if (conversationUser?.sender?._id === conversationUser?.receiver?._id) {
                    return {
                        ...conversationUser,
                        userDetails: conversationUser?.sender
                    }
                } else if (conversationUser?.receiver?._id !== user?._id) {
                    return {
                        ...conversationUser,
                        userDetails: conversationUser.receiver
                    }
                } else {
                    return {
                        ...conversationUser,
                        userDetails: conversationUser.sender
                    }
                }
            });
            setAllUser(conversationUserData);
        };

        socketConnection.on('conversation', handleConversation);

        // Optionally handle socket reconnection
        const handleReconnect = () => {
            socketConnection.emit('sidebar', user._id);
        };
        socketConnection.on('connect', handleReconnect);

        // Cleanup listeners on unmount or user/socket change
        return () => {
            socketConnection.off('conversation', handleConversation);
            socketConnection.off('connect', handleReconnect);
        };
    }, [socketConnection, user]);

    return (
        <div className='w-full h-full flex flex-col bg-white'>
            <div className='h-16 w-full flex items-center justify-between px-1 bg-white shadow'>
                {/* Profile Avatar */}
                <button title={user?.name} onClick={() => setEditUserOpen(true)} className='flex items-center'>
                    <Avatar
                        width={35}
                        height={35}
                        name={user?.name}
                        imageUrl={user?.profile_pic}
                        userId={user?._id}
                    />
                </button>
                {/* Title */}
                <h2 className='text-xl font-bold text-slate-800 flex-1 text-center'>Chat</h2>
                {/* Add Friend */}
                <div
                    title='Add friend'
                    onClick={() => setOpenSearchUser(true)}
                    className='w-8 h-8 flex justify-center items-center cursor-pointer bg-yellow-300 hover:bg-slate-200 rounded-full mx-2'
                >
                    <IoPersonAddSharp size={20} />
                </div>
                {/* More Options */}
                <button className='cursor-pointer p-1 text-gray-700 bg-slate-200 rounded-full hover:text-primary mx-2'>
                    <TbDots size={25} />
                </button>
            </div>

            <div className=' h-[calc(100vh-65px)] overflow-x-hidden overflow-y-auto scrollbar'>
                {allUser.length === 0 && (
                    <div className='mt-12'>
                        <div className='flex justify-center items-center my-4 text-slate-500'>
                            <FiArrowUpLeft size={50} />
                        </div>
                        <p className='text-lg text-center text-slate-400'>Explore users to start a conversation with.</p>
                    </div>
                )}
                {allUser.map((conv) => (
                    <div key={conv?._id}>
                        <NavLink to={`${basePathAction(ENDPOINTS.CHAT)}/${conv?.userDetails?._id}`} key={conv?._id} className='flex items-center gap-2 py-3 px-2 border border-transparent hover:border-primary rounded hover:bg-slate-100 cursor-pointer'>
                            <Avatar
                                imageUrl={conv?.userDetails?.profile_pic}
                                name={conv?.userDetails?.name}
                                width={40}
                                height={40}
                                userId={conv?.userDetails?._id}
                            />
                            <div>
                                <h3 className='text-ellipsis line-clamp-1 font-semibold text-base'>{conv?.userDetails?.name}</h3>
                                <div className='text-slate-500 text-xs flex items-center gap-1'>
                                    <div className='flex items-center gap-1'>
                                        {conv?.lastMsg?.imageUrl && (
                                            <div className='flex items-center gap-1'>
                                                <span><FaImage /></span>
                                                {!conv?.lastMsg?.text && <span>Image</span>}
                                            </div>
                                        )}
                                        {conv?.lastMsg?.videoUrl && (
                                            <div className='flex items-center gap-1'>
                                                <span><FaVideo /></span>
                                                {!conv?.lastMsg?.text && <span>Video</span>}
                                            </div>
                                        )}
                                    </div>
                                    <p className={`text-ellipsis line-clamp-1 ${Boolean(conv?.unseenMsg) ? 'font-bold text-black' : ''}`}>{conv?.lastMsg?.text}</p>
                                </div>
                            </div>
                            {Boolean(conv?.unseenMsg) && (
                                <p className='text-xs w-6 h-6 flex justify-center items-center ml-auto p-1 bg-primary text-white font-semibold rounded-full'>{conv?.unseenMsg}</p>
                            )}
                        </NavLink>
                        <Divider />
                    </div>
                ))}
            </div>
            {/* Modal */}
            {editUserOpen && (
                <EditUserProfile onClose={() => setEditUserOpen(false)} user={user} />
            )}
            {openSearchUser && (
                <SearchUser onClose={() => setOpenSearchUser(false)} />
            )}
        </div>
    )
}

export default Sidebar