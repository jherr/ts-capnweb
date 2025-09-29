import { useState } from "react";
import type { AuctionState } from "../hooks/useAuctionParticipation";

interface BiddingInterfaceProps {
  auctionState: AuctionState;
  isJoined: boolean;
  onPlaceBid: (amount: number) => Promise<boolean>;
  onAddNotification: (notification: any) => void;
}

export function BiddingInterface({
  auctionState,
  isJoined,
  onPlaceBid,
  onAddNotification,
}: BiddingInterfaceProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getMinBid = (): number => {
    if (auctionState.currentBid) {
      return auctionState.currentBid.amount + 1000;
    }
    return auctionState.item?.startingPrice || 0;
  };

  const handleQuickBid = (amount: number) => {
    setBidAmount(amount.toString());
  };

  const handlePlaceBid = async () => {
    const amount = parseInt(bidAmount);
    const minBid = getMinBid();

    if (amount < minBid) {
      onAddNotification({
        type: "error",
        message: `Bid must be at least $${minBid.toLocaleString()}`,
        timestamp: new Date().toISOString(),
        className: "bg-red-800 border-red-400",
      });
      return;
    }

    setIsSubmitting(true);
    const success = await onPlaceBid(amount);

    if (success) {
      onAddNotification({
        type: "success",
        message: `Bid placed: $${amount.toLocaleString()}`,
        timestamp: new Date().toISOString(),
        className: "bg-blue-800 border-blue-400",
      });
      setBidAmount("");
    } else {
      onAddNotification({
        type: "error",
        message: `Failed to place bid`,
        timestamp: new Date().toISOString(),
        className: "bg-red-800 border-red-400",
      });
    }

    setIsSubmitting(false);
  };

  if (!auctionState.item || auctionState.status !== "active") {
    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 mb-6 opacity-50">
        <div className="text-center text-gray-400">
          <span className="text-2xl">🔒</span>
          <div className="text-lg font-semibold mt-2">Bidding Closed</div>
          <div className="text-sm">
            {auctionState.status === "ended"
              ? "Auction has ended"
              : "Waiting for next auction"}
          </div>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 mb-6 opacity-50">
        <div className="text-center text-gray-400">
          <span className="text-2xl">👤</span>
          <div className="text-lg font-semibold mt-2">Join Required</div>
          <div className="text-sm">Join the auction to place bids</div>
        </div>
      </div>
    );
  }

  const minBid = getMinBid();
  const quickBidAmounts = [
    minBid,
    minBid + 5000,
    minBid + 10000,
    minBid + 25000,
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-3xl">💰</span>
        <div>
          <h3 className="text-xl font-bold text-white">Place Your Bid</h3>
          <div className="text-gray-400 text-sm">
            Minimum bid: ${minBid.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Quick Bid Buttons */}
      <div className="mb-4">
        <div className="text-gray-400 text-sm mb-2">Quick Bids:</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {quickBidAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickBid(amount)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
              disabled={isSubmitting}
            >
              ${amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Bid Input */}
      <div className="flex space-x-3">
        <div className="flex-1">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              $
            </span>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={minBid.toString()}
              className="w-full pl-8 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-lg font-mono"
              disabled={isSubmitting}
              min={minBid}
              step={1000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && bidAmount.trim()) {
                  handlePlaceBid();
                }
              }}
            />
          </div>
        </div>
        <button
          onClick={handlePlaceBid}
          disabled={
            !bidAmount.trim() || isSubmitting || parseInt(bidAmount) < minBid
          }
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold transition-colors flex items-center space-x-2 text-lg"
        >
          {isSubmitting ? (
            <>
              <span>🔄</span>
              <span>Bidding...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Bid</span>
            </>
          )}
        </button>
      </div>

      {/* Bid validation message */}
      {bidAmount && parseInt(bidAmount) < minBid && (
        <div className="mt-2 text-red-400 text-sm">
          ⚠️ Bid must be at least ${minBid.toLocaleString()}
        </div>
      )}
    </div>
  );
}
