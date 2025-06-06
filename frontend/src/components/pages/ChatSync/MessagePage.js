import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { HiDotsVertical } from "react-icons/hi";
import { FaAngleLeft, FaPlus, FaImage, FaVideo } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import backgroundImage from '../../../assets/wallapaper.jpeg'
import { IoMdSend } from "react-icons/io";
import moment from 'moment'
import uploadFile from '../../../helpers/uploadFile';
import { getSocket } from '../../../lib/socket';
import Loading from '../../loader/Loading';
import Base from '../../../util/Base';
import { ENDPOINTS } from '../../../utility/ApiEndpoints';
import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";
import Avatar from '../../helperComponent/Avatar';

const MessagePage = () => {
    const { basePathAction, getDateLabel, localeTimeString } = Base();
    const params = useParams()
    const socketConnection = getSocket()
    const user = useSelector(state => state?.user)
    const [isTyping, setIsTyping] = useState(false)
    const [dataUser, setDataUser] = useState({
        name: "",
        email: "",
        profile_pic: "",
        online: false,
        _id: "",
        lastSeen: ""
    })

    const isOnline = user?.onlineUser?.includes(dataUser?._id)
    // console.log('lastSeen', user?.lastSeen)
    const [openImageVideoUpload, setOpenImageVideoUpload] = useState(false)
    const [message, setMessage] = useState({
        text: "",
        imageUrl: "",
        videoUrl: ""
    })
    const [loading, setLoading] = useState(false)
    const [allMessage, setAllMessage] = useState([])
    const currentMessage = useRef(null)

    useEffect(() => {
        if (currentMessage.current) {
            currentMessage.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
    }, [allMessage])

    // Socket event management
    useEffect(() => {
        if (!socketConnection || !user?._id) return;

        // Request user and message data
        socketConnection.emit('chat-screen', params.userId);
        socketConnection.emit('seen', params.userId);
        socketConnection.emit('message-page', params.userId);

        // Handlers
        const handleMessageUser = (data) => setDataUser(data);
        const handleMessage = (data) => setAllMessage(data);
        const handleTyping = (data) => {
            if (data.sender === params.userId) {
                setIsTyping(true);
                // Remove typing after 2 seconds of inactivity
                if (window.typingTimeout) clearTimeout(window.typingTimeout);
                window.typingTimeout = setTimeout(() => setIsTyping(false), 2000);
            }
        };

        socketConnection.on('message-user', handleMessageUser);
        socketConnection.on('message', handleMessage);
        socketConnection.on('typing', handleTyping);

        // Cleanup listeners on unmount or param/user change
        return () => {
            // clearTimeout(timeoutId)
            socketConnection.emit('clear-chat-screen');
            socketConnection.off('message-user', handleMessageUser);
            socketConnection.off('message', handleMessage);
            socketConnection.off('typing', handleTyping);
            if (window.typingTimeout) clearTimeout(window.typingTimeout);
        }
    }, [socketConnection, params?.userId, user]);

    const handleUploadImageVideoOpen = () => {
        setOpenImageVideoUpload(preve => !preve)
    }

    const handleUploadImage = async (e) => {
        const file = e.target.files[0]
        if (!file) return;
        try {
            setLoading(true)
            const uploadPhoto = await uploadFile(file)
            setMessage(preve => ({
                ...preve,
                imageUrl: uploadPhoto.url
            }))
        } catch (err) {
            alert("Failed to upload image.")
        } finally {
            setLoading(false)
            setOpenImageVideoUpload(false)
        }
    }

    const handleClearUploadImage = () => {
        setMessage(preve => ({
            ...preve,
            imageUrl: ""
        }))
    }

    const handleUploadVideo = async (e) => {
        const file = e.target.files[0]
        if (!file) return;
        try {
            setLoading(true)
            const uploadPhoto = await uploadFile(file)
            setMessage(preve => ({
                ...preve,
                videoUrl: uploadPhoto.url
            }))
        } catch (err) {
            alert("Failed to upload video.")
        } finally {
            setLoading(false)
            setOpenImageVideoUpload(false)
        }
    }

    const handleClearUploadVideo = () => {
        setMessage(preve => ({
            ...preve,
            videoUrl: ""
        }))
    }

    const handleOnChange = (e) => {
        const { value } = e.target
        setMessage(preve => ({
            ...preve,
            text: value
        }));

        // Emit typing event
        if (socketConnection && user?._id) {
            socketConnection.emit('typing', {
                sender: user._id,
                receiver: params.userId
            });
        }
    }

    const handleSendMessage = (e) => {
        e.preventDefault()
        if (!(message.text || message.imageUrl || message.videoUrl)) return;

        if (socketConnection && user?._id) {
            socketConnection.emit('new message', {
                sender: user._id,
                receiver: params.userId,
                text: message.text,
                imageUrl: message.imageUrl,
                videoUrl: message.videoUrl,
                msgByUserId: user._id
            })
            setMessage({
                text: "",
                imageUrl: "",
                videoUrl: ""
            })
        }
    }

    console.log('dataUser', dataUser)

    return (
        <div style={{ backgroundImage: `url(${backgroundImage})` }} className='bg-no-repeat bg-cover h-full'>
            <header className='sticky top-0 h-16 bg-white flex justify-between items-center px-4'>
                <div className='flex items-center gap-4'>
                    <Link to={`${basePathAction(ENDPOINTS.CHAT)}`} className='lg:hidden'>
                        <FaAngleLeft size={25} />
                    </Link>
                    <div>
                        <Avatar
                            width={50}
                            height={50}
                            imageUrl={dataUser?.profile_pic}
                            name={dataUser?.name}
                            userId={dataUser?._id}
                        />
                    </div>
                    <div>
                        <h3 className='font-semibold text-lg my-0 text-ellipsis line-clamp-1'>{dataUser?.name}</h3>
                        <p className='-my-2 text-sm'>
                            {isTyping ? (
                                <span className="text-gray-600 text-sm italic animate-pulse">
                                    Typing...
                                </span>
                            ) : (

                                isOnline
                                    ? <span className='text-primary'>online</span>
                                    : <span className='text-slate-500'>{`last seen ${getDateLabel(dataUser?.lastSeen)} at ${localeTimeString(dataUser?.lastSeen)}`}</span>
                            )}
                        </p>
                    </div>
                </div>
                <div>
                    <button className='cursor-pointer hover:text-primary'>
                        <HiDotsVertical />
                    </button>
                </div>
            </header>

            {/* Show all messages */}
            <section className='h-[calc(100vh-128px)] overflow-x-hidden overflow-y-scroll scrollbar relative bg-slate-200 bg-opacity-50'>
                <div className='flex flex-col gap-2 py-2 mx-2' ref={currentMessage}>
                    {
                        allMessage.map((msg, index) => (
                            <div key={msg._id || index} className={`p-1 py-1 rounded w-fit max-w-[280px] md:max-w-sm lg:max-w-md ${user._id === msg?.msgByUserId ? "ml-auto bg-teal-100" : "bg-white"}`}>
                                <div className='w-full relative'>
                                    {msg?.imageUrl && (
                                        <img
                                            src={msg?.imageUrl}
                                            alt='img'
                                            className='w-full h-full object-scale-down'
                                        />
                                    )}
                                    {msg?.videoUrl && (
                                        <video
                                            src={msg.videoUrl}
                                            className='w-full h-full object-scale-down'
                                            controls
                                        />
                                    )}
                                </div>
                                <p className='px-2'>{msg.text}</p>
                                <div className="flex items-center gap-1">
                                    <p className='text-xs ml-auto w-fit'>{moment(msg.createdAt).format('hh:mm')}</p>
                                    {user._id === msg?.msgByUserId && (
                                        <>
                                            {msg.status === 'sent' && <IoCheckmark className="text-gray-400" />}
                                            {msg.status === 'delivered' && <IoCheckmarkDone className="text-gray-400" />}
                                            {msg.status === 'seen' && <IoCheckmarkDone className="text-blue-500 tick" />}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                </div>

                {/* Upload Image display */}
                {
                    message.imageUrl && (
                        <div className='w-full h-full sticky bottom-0 bg-slate-700 bg-opacity-30 flex justify-center items-center rounded overflow-hidden'>
                            <div className='w-fit p-2 absolute top-0 right-0 cursor-pointer hover:text-red-600' onClick={handleClearUploadImage}>
                                <IoClose size={30} />
                            </div>
                            <div className='bg-white p-3'>
                                <img
                                    src={message.imageUrl}
                                    alt='uploadImage'
                                    className='aspect-square w-full h-full max-w-sm m-2 object-scale-down'
                                />
                            </div>
                        </div>
                    )
                }

                {/* Upload video display */}
                {
                    message.videoUrl && (
                        <div className='w-full h-full sticky bottom-0 bg-slate-700 bg-opacity-30 flex justify-center items-center rounded overflow-hidden'>
                            <div className='w-fit p-2 absolute top-0 right-0 cursor-pointer hover:text-red-600' onClick={handleClearUploadVideo}>
                                <IoClose size={30} />
                            </div>
                            <div className='bg-white p-3'>
                                <video
                                    src={message.videoUrl}
                                    className='aspect-square w-full h-full max-w-sm m-2 object-scale-down'
                                    controls
                                    muted
                                    autoPlay
                                />
                            </div>
                        </div>
                    )
                }

                {loading && (
                    <div className='w-full h-full flex sticky bottom-0 justify-center items-center'>
                        <Loading />
                    </div>
                )}
            </section>

            {/* Send message */}
            <section className='h-16 bg-white flex items-center px-4'>
                <div className='relative'>
                    <button onClick={handleUploadImageVideoOpen} className='flex justify-center items-center w-11 h-11 rounded-full hover:bg-primary hover:text-white'>
                        <FaPlus size={20} />
                    </button>
                    {/* Video and image upload */}
                    {
                        openImageVideoUpload && (
                            <div className='bg-white shadow rounded absolute bottom-14 w-36 p-2'>
                                <form>
                                    <label htmlFor='uploadImage' className='flex items-center p-2 px-3 gap-3 hover:bg-slate-200 cursor-pointer'>
                                        <div className='text-primary'>
                                            <FaImage size={18} />
                                        </div>
                                        <p>Image</p>
                                    </label>
                                    <label htmlFor='uploadVideo' className='flex items-center p-2 px-3 gap-3 hover:bg-slate-200 cursor-pointer'>
                                        <div className='text-purple-500'>
                                            <FaVideo size={18} />
                                        </div>
                                        <p>Video</p>
                                    </label>
                                    <input
                                        type='file'
                                        id='uploadImage'
                                        accept='image/*'
                                        onChange={handleUploadImage}
                                        className='hidden'
                                    />
                                    <input
                                        type='file'
                                        id='uploadVideo'
                                        accept='video/*'
                                        onChange={handleUploadVideo}
                                        className='hidden'
                                    />
                                </form>
                            </div>
                        )
                    }
                </div>
                {/* Input box */}
                <form className='h-full w-full flex gap-2' onSubmit={handleSendMessage}>
                    <input
                        type='text'
                        placeholder='Type here message...'
                        className='py-1 px-4 outline-none w-full h-full'
                        value={message.text}
                        onChange={handleOnChange}
                    />
                    <button className='text-primary hover:text-secondary' type="submit">
                        <IoMdSend size={28} />
                    </button>
                </form>
            </section>
        </div>
    )
}

export default MessagePage
