import React from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../../avatar/Avatar'
import { ENDPOINTS } from '../../../utility/ApiEndpoints'
import Base from '../../../util/Base'
import { IoMdPersonAdd } from "react-icons/io";

const UserSearchCard = ({ user, onClose }) => {
    const { basePathAction } = Base()
    return (
        <div className='flex items-center gap-3 p-2 lg:p-3 border border-transparent border-b-slate-200 hover:border rounded cursor-pointer'>
            {/* Avatar on the left */}
            <Avatar
                width={50}
                height={50}
                name={user?.name}
                userId={user?._id}
                imageUrl={user?.profile_pic}
            />
            {/* Name and username in the middle */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className='font-semibold text-ellipsis overflow-hidden whitespace-nowrap'>{user?.name}</div>
                <p className='text-sm fs-12 text-ellipsis overflow-hidden whitespace-nowrap text-slate-500'>{user?.userName}</p>
            </div>
            {/* Add button on the right */}
            <Link
                to={`${basePathAction(ENDPOINTS.CHAT)}/${user?._id}`}
                onClick={onClose}
                className='ml-auto bg-blue-500 hover:bg-blue-600 rounded-3xl text-white px-4 py-1.5 text-sm font-semibold flex items-center gap-1'
            >
                <IoMdPersonAdd size={17}/> Add
            </Link>
        </div>
    )
}

export default UserSearchCard
