import React from "react";
import type { Notification } from "../hooks/useAuctionMessages";

interface NotificationsFeedProps {
  notifications: Notification[];
  onClearNotifications: () => void;
}

export function NotificationsFeed({
  notifications,
  onClearNotifications,
}: NotificationsFeedProps) {
  // Removed auto-scroll behavior to prevent scroll-jacking

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "welcome":
        return "👋";
      case "user_joined":
        return "🚪";
      case "user_left":
        return "👋";
      case "bid_update":
        return "💰";
      case "timer_update":
        return "⏱️";
      case "auction_start":
        return "🎬";
      case "auction_end":
        return "🏁";
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "timer_extended":
        return "⏰";
      default:
        return "📢";
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>📢</span>
            <span>Activity Feed</span>
          </h3>
        </div>
        <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-3">🔇</div>
          <div>No activity yet</div>
          <div className="text-sm mt-1">
            Join the auction to see real-time updates
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <span>📢</span>
          <span>Activity Feed</span>
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            {notifications.length}
          </span>
        </h3>
        <button
          onClick={onClearNotifications}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {notifications.map((notification, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border-l-4 ${
              notification.className || "bg-gray-700 border-blue-400"
            }`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-lg flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm leading-relaxed">
                  {notification.message}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  {formatTime(notification.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-600 text-center">
        <div className="text-gray-400 text-xs">
          🔄 Updates every second via Cap'n Web RPC
        </div>
      </div>
    </div>
  );
}
