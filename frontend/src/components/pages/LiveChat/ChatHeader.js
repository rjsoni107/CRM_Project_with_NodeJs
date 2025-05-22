import { useEffect } from "react";
import Base from "../../../util/Base";

const ChatHeader = ({ friend, isLoading, isTyping, lastSeen, setLastSeen }) => {
    const { isOnline, getDateLabel, localeTimeString } = Base();

    // useEffect(() => {
    //     if (friend && friend[0]?.lastSeen) setLastSeen(friend[0].lastSeen)
    // })

    if (isLoading) {
        return (
            <div className="bg-teal-900 p-2 flex items-center shadow-md flex-shrink-0">
                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    <div className="animate-pulse">F</div>
                </div>
                <div className="ml-3">
                    <h2 className="text-xl font-bold text-white animate-pulse">
                        Loading...
                    </h2>
                </div>
            </div>
        );
    }
    return (
        <div className="bg-teal-900 p-2 flex items-center shadow-md flex-shrink-0">
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {friend ? friend[0].name[0] : 'F'}
            </div>
            <div className="ml-3">
                <h2 className="text-xl font-bold text-white">
                    {friend ? friend[0].name : 'Friend'}
                </h2>
                {isTyping ? (
                    <div className="text-gray-300 text-sm italic animate-pulse">
                        Typing...
                    </div>
                ) : (
                    <>
                        {lastSeen && (
                            <p className="text-sm text-white opacity-75">
                                {isOnline(lastSeen)
                                    ? 'Online'
                                    : `Last seen ${getDateLabel(lastSeen)} at ${localeTimeString(lastSeen)}`}
                            </p>
                        )}
                    </>

                )}
            </div>
        </div>
    );
};

export default ChatHeader;