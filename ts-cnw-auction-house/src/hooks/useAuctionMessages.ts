import { useState, useEffect, useCallback } from "react";
import type { AuctionAPI } from "./useAuctionConnection";
import type { AuctionState } from "./useAuctionParticipation";

export interface Notification {
  type: string;
  message: string;
  timestamp: string;
  className?: string;
}

export function useAuctionMessages(
  api: AuctionAPI | null,
  isConnected: boolean,
  isJoined: boolean,
  updateAuctionState: (updates: Partial<AuctionState>) => void,
  setAuctionHistory: (history: any[]) => void,
  currentItemName?: string
) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Message polling effect
  useEffect(() => {
    if (!api || !isConnected || !isJoined) {
      return;
    }

    let pollInterval: NodeJS.Timeout;

    const startPolling = () => {
      console.log("🔄 Starting message polling...");

      const poll = async () => {
        try {
          const messages = await api.pollMessages();

          if (messages && messages.length > 0) {
            console.log(`📨 Received ${messages.length} messages from server`);

            messages.forEach((message) => {
              console.log(
                `📨 Processing message:`,
                message.type,
                message.message
              );

              // Add to notifications
              addNotification({
                type: message.type || "info",
                message: message.message,
                timestamp: new Date(
                  message.timestamp || Date.now()
                ).toISOString(),
                className: message.className,
              });

              // Update auction state based on message type
              if (message.type === "bid_update") {
                updateAuctionState({
                  currentBid: message.currentBid,
                  bidCount: message.bidCount,
                });
              } else if (message.type === "timer_update") {
                updateAuctionState({
                  timeRemaining: message.timeRemaining,
                });
              } else if (message.type === "auction_start") {
                updateAuctionState({
                  item: message.item,
                  currentBid: null,
                  timeRemaining: message.duration,
                  status: "active",
                  bidCount: 0,
                });
                // Refresh history
                api.getAuctionHistory().then(setAuctionHistory);
              } else if (message.type === "auction_end") {
                updateAuctionState({
                  status: "ended",
                  timeRemaining: 0,
                });
                if (message.winner && message.finalPrice) {
                  setAuctionHistory((prev) => [
                    ...prev,
                    {
                      name: currentItemName || "Unknown Item",
                      finalPrice: message.finalPrice,
                      winner: message.winner,
                    },
                  ]);
                }
              }
            });
          }
        } catch (error) {
          console.error("❌ Polling error:", error);
        }
      };

      // Initial poll
      poll();

      // Set up interval polling every 1 second
      pollInterval = setInterval(poll, 1000);
    };

    startPolling();

    return () => {
      if (pollInterval) {
        console.log("🛑 Stopping message polling...");
        clearInterval(pollInterval);
      }
    };
  }, [
    api,
    isConnected,
    isJoined,
    currentItemName,
    updateAuctionState,
    setAuctionHistory,
    addNotification,
  ]);

  return {
    notifications,
    addNotification,
    clearNotifications,
  };
}
