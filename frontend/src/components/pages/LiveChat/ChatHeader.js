import Base from "../../../util/Base";

const ChatHeader = ({ friend, isLoading }) => {
    const { isOnline, getDateLabel } = Base();

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
                {friend[0]?.lastSeen && (
                    <p className="text-sm text-white opacity-75">
                        {isOnline(friend[0])
                            ? 'Online'
                            : `Last seen ${getDateLabel(friend[0].lastSeen)} at ${new Date(friend[0].lastSeen).toLocaleTimeString()}`}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ChatHeader;