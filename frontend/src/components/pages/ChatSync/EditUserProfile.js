import React, { useEffect, useRef, useState } from 'react'
import taost from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import Avatar from '../../helperComponent/Avatar'
import { setUser } from '../../../redux/userSlice'
import uploadFile from '../../../helpers/uploadFile'
import { ENDPOINTS } from '../../../utility/ApiEndpoints'
import Base from '../../../util/Base'
import { FaCamera, FaPen } from 'react-icons/fa'
import Loading from '../../loader/Loading'

const EditUserProfile = ({ onClose, user }) => {
    const [data, setData] = useState({
        name: user?.name,
        about: user?.about || '',
        profile_pic: user?.profile_pic,
    })
    const uploadPhotoRef = useRef()
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false);
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
        setLoading(true);
        try {
            const file = e.target.files[0];
            const uploadPhoto = await uploadFile(file);
            setData((preve) => ({
                ...preve,
                profile_pic: uploadPhoto?.url
            }));
        } catch (error) {
            taost.error("Failed to upload photo");
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        setLoading(true);
        try {
            const actionName = ENDPOINTS.UPDATE_USER_PROFILE;
            const payload = {
                name: data.name,
                profile_pic: data.profile_pic,
                about: data.about
            }
            const responseJson = await fetchData('POST', apiPathAction(actionName), payload);
            const { success, profileData } = responseJson || {};

            if (success) {
                console.log('Profile updated successfully');
                dispatch(setUser(profileData))
                onClose()
            }

        } catch (error) {
            console.log(error)
            taost.error("Failed to save profile");
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-[#222d34] rounded-lg shadow-lg flex w-full max-w-96 h-[80vh] overflow-hidden">
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
            </div>
            {loading && (
                <div className="absolute inset-0 bg-black bg-opacity-65 flex items-center justify-center z-50">
                    <Loading />
                </div>
            )}
        </div>
    );
}

export default React.memo(EditUserProfile)
