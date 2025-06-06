import React, { useEffect, useRef, useState } from 'react'
import taost from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import Avatar from '../../helperComponent/Avatar'
import { setUser } from '../../../redux/userSlice'
import uploadFile from '../../../helpers/uploadFile'
import { ENDPOINTS } from '../../../utility/ApiEndpoints'
import Base from '../../../util/Base'
import Divider from '../../helperComponent/Divider'
import { FaCamera, FaPen } from 'react-icons/fa'

const EditUserProfile = ({ onClose, user }) => {
    const [data, setData] = useState({
        name: user?.name,
        about: user?.about || '',
        profile_pic: user?.profile_pic,
    })
    const uploadPhotoRef = useRef()
    const dispatch = useDispatch()
    const { fetchData, apiPathAction } = Base();

    useEffect(() => {
        setData((preve) => ({
            ...preve,
            name: user?.name,
            profile_pic: user?.profile_pic,
            about: user?.about || ''
        }))

    }, [user])

    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleOpenUploadPhoto = (e) => {
        e.preventDefault();
        e.stopPropagation();

        uploadPhotoRef.current.click();
    }

    const handleUploadPhoto = async (e) => {
        const file = e.target.files[0];
        const uploadPhoto = await uploadFile(file);

        setData((preve) => {
            return {
                ...preve,
                profile_pic: uploadPhoto?.url
            }
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            const actionName = ENDPOINTS.UPDATE_USER_PROFILE;
            const payload = {
                name: data.name, 
                profile_pic: data.profile_pic,
                about: data.about
             }
            const responseJson = await fetchData('POST', apiPathAction(actionName), payload);
            const { message, success  } = responseJson?.data || {};
            taost.success(message)

            if (success) {
                dispatch(setUser(responseJson.data))
                onClose()
            }

        } catch (error) {
            console.log(error)
            // taost.error()
        }
    }
    // return (
    //     <div className='fixed top-0 bottom-0 left-0 right-0 bg-gray-700 bg-opacity-40 flex justify-center items-center z-10'>
    //         <div className='bg-white p-4 py-6 m-1 rounded w-full max-w-sm'>
    //             <h2 className='font-semibold'>Profile Details</h2>
    //             <p className='text-sm '>Edit user details</p>

    //             <form className='grid gap-3 mt-3' onSubmit={handleSubmit}>
    //                 <div className='flex flex-col gap-1'>
    //                     <label htmlFor='name'>Your name:</label>
    //                     <input
    //                         type='text'
    //                         name='name'
    //                         id='name'
    //                         value={data.name}
    //                         onChange={handleOnChange}
    //                         className='w-full py-1 px-2 focus:outline-primary border-0.5'
    //                     />
    //                 </div>

    //                 <div>
    //                     <div>Photo:</div>
    //                     <div className='my-1 flex items-center gap-4'>
    //                         <Avatar
    //                             width={40}
    //                             height={40}
    //                             imageUrl={data?.profile_pic}
    //                             name={data?.name}
    //                         />
    //                         <label htmlFor='profile_pic'>
    //                             <button className='font-semibold' onClick={handleOpenUploadPhoto}>Change Photo</button>
    //                             <input
    //                                 type='file'
    //                                 id='profile_pic'
    //                                 className='hidden'
    //                                 onChange={handleUploadPhoto}
    //                                 ref={uploadPhotoRef}
    //                             />
    //                         </label>
    //                     </div>
    //                 </div>

    //                 <Divider />
    //                 <div className='flex gap-2 w-fit ml-auto '>
    //                     <button onClick={onClose} className='border-primary border text-primary px-4 py-1 rounded hover:bg-primary hover:text-white'>Cancel</button>
    //                     <button onClick={handleSubmit} className='border-primary bg-primary text-white border px-4 py-1 rounded hover:bg-secondary'>Save</button>
    //                 </div>
    //             </form>
    //         </div>
    //     </div>
    // )
    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-[#222d34] rounded-lg shadow-lg flex w-full max-w-96 h-[80vh] overflow-hidden">
                {/* Left: Profile */}
                <div className="w-full flex flex-col items-center justify-center p-8 bg-[#222d34] text-white">
                    <div className="relative group mb-6">
                        <Avatar
                            width={160}
                            height={160}
                            imageUrl={data.profile_pic}
                            name={data.name}
                        />
                        <button
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 rounded-full opacity-0 group-hover:opacity-100 transition"
                            onClick={handleOpenUploadPhoto}
                            title="Change profile photo"
                        >
                            <FaCamera size={32} />
                            <span className="mt-2 text-xs font-semibold">CHANGE<br />PROFILE PHOTO</span>
                        </button>
                        <input
                            type="file"
                            className="hidden"
                            ref={uploadPhotoRef}
                            onChange={handleUploadPhoto}
                        />
                    </div>
                    <div className="w-full mt-4">
                        <label className="text-blue-400 text-sm">Your name</label>
                        <div className="flex items-center mt-1">
                            <input
                                type="text"
                                name="name"
                                value={data.name}
                                onChange={handleChange}
                                className="bg-transparent border-b border-gray-500 text-white text-lg flex-1 outline-none"
                            />
                            <FaPen className="ml-2 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            This is not your username or PIN. This name will be visible to your contacts.
                        </p>
                    </div>
                    <div className="w-full mt-6">
                        <label className="text-blue-400 text-sm">About</label>
                        <div className="flex items-center mt-1">
                            <input
                                type="text"
                                name="about"
                                value={data.about}
                                onChange={handleChange}
                                className="bg-transparent border-b border-gray-500 text-white text-base flex-1 outline-none"
                            />
                            <FaPen className="ml-2 text-gray-400" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-8">
                        <button onClick={onClose} className="px-6 py-2 rounded border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition">Cancel</button>
                        <button onClick={handleSubmit} className="px-6 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition">Save</button>
                    </div>
                </div>
                {/* Right: Info/Placeholder */}
                {/* <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#222d34] border-l border-gray-700">
                    <img src="https://static.whatsapp.net/rsrc.php/v3/yx/r/8lR5X6i2R6v.png" alt="WhatsApp Windows" className="w-96 mb-8" />
                    <h2 className="text-2xl font-semibold mb-2 text-white">Download WhatsApp for Windows</h2>
                    <p className="text-gray-400 text-center max-w-xs mb-6">
                        Make calls, share your screen and get a faster experience when you download the Windows app.
                    </p>
                    <button className="bg-green-500 text-white px-8 py-2 rounded-full font-semibold hover:bg-green-600 transition">Download</button>
                    <p className="text-xs text-gray-500 mt-4">Your personal messages are end-to-end encrypted</p>
                </div> */}
            </div>
        </div>
    );
}

export default React.memo(EditUserProfile)
