import { useState } from "react";

interface UserLoginProps {
  username: string;
  isJoined: boolean;
  isConnected: boolean;
  onUsernameChange: (username: string) => void;
  onJoinAuction: () => Promise<boolean>;
  onLeaveAuction: () => void;
  onAddNotification: (notification: any) => void;
}

export function UserLogin({
  username,
  isJoined,
  isConnected,
  onUsernameChange,
  onJoinAuction,
  onLeaveAuction,
  onAddNotification,
}: UserLoginProps) {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinAuction = async () => {
    if (!username.trim()) return;

    setIsJoining(true);
    const success = await onJoinAuction();

    if (success) {
      onAddNotification({
        type: "success",
        message: `Welcome to the Galactic Auction House, ${username}!`,
        timestamp: new Date().toISOString(),
        className: "bg-green-800 border-green-400",
      });
    } else {
      onAddNotification({
        type: "error",
        message: `Failed to join auction`,
        timestamp: new Date().toISOString(),
        className: "bg-red-800 border-red-400",
      });
    }

    setIsJoining(false);
  };

  const handleLeaveAuction = () => {
    onLeaveAuction();
    onAddNotification({
      type: "info",
      message: `${username} left the auction`,
      timestamp: new Date().toISOString(),
      className: "bg-gray-700 border-gray-400",
    });
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 mb-6 opacity-50">
        <div className="text-gray-400 text-center">
          Connect to the server first to join the auction
        </div>
      </div>
    );
  }

  if (isJoined) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">👤</span>
            <div>
              <div className="font-semibold text-green-400">
                Joined as {username}
              </div>
              <div className="text-gray-400 text-sm">
                Ready to bid on legendary treasures!
              </div>
            </div>
          </div>
          <button
            onClick={handleLeaveAuction}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Leave Auction
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 mb-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🚪</span>
          <div>
            <div className="font-semibold text-yellow-400">
              Join the Auction
            </div>
            <div className="text-gray-400 text-sm">
              Enter your bidder name to participate
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <input
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="Enter your name..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            disabled={isJoining}
            onKeyDown={(e) => {
              if (e.key === "Enter" && username.trim()) {
                handleJoinAuction();
              }
            }}
          />
          <button
            onClick={handleJoinAuction}
            disabled={!username.trim() || isJoining}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isJoining ? (
              <>
                <span>🔄</span>
                <span>Joining...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Join Auction</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
