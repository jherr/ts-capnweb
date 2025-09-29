import type { AuctionState } from "../hooks/useAuctionParticipation";

interface CurrentAuctionProps {
  auctionState: AuctionState;
}

export function CurrentAuction({ auctionState }: CurrentAuctionProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = (timeRemaining: number): string => {
    if (timeRemaining <= 30) return "text-red-400";
    if (timeRemaining <= 60) return "text-yellow-400";
    return "text-green-400";
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case "legendary":
        return "text-orange-400";
      case "rare":
        return "text-purple-400";
      case "common":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const getMinBid = (): number => {
    if (auctionState.currentBid) {
      return auctionState.currentBid.amount + 1000;
    }
    return auctionState.item?.startingPrice || 0;
  };

  if (!auctionState.item) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 mb-6">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-xl font-semibold">
            Waiting for next auction...
          </div>
          <div className="text-sm mt-2">
            Legendary sci-fi treasures are being prepared!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 mb-6">
      <div className="flex flex-col lg:flex-row lg:space-x-6">
        {/* Item Info */}
        <div className="flex-1 mb-6 lg:mb-0">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {auctionState.item.name}
              </h2>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">from</span>
                <span className="text-blue-400 font-medium">
                  {auctionState.item.movie}
                </span>
                <span
                  className={`font-bold ${getRarityColor(
                    auctionState.item.rarity
                  )}`}
                >
                  [{auctionState.item.rarity.toUpperCase()}]
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-300 text-sm mb-4 leading-relaxed">
            {auctionState.item.description}
          </p>

          <div className="flex items-center space-x-4 text-sm">
            <div>
              <span className="text-gray-400">Starting Price:</span>
              <span className="text-green-400 font-bold ml-2">
                ${auctionState.item.startingPrice.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Bids:</span>
              <span className="text-blue-400 font-bold ml-2">
                {auctionState.bidCount}
              </span>
            </div>
          </div>
        </div>

        {/* Auction Status */}
        <div className="lg:w-80">
          <div className="bg-gray-700 p-4 rounded-lg">
            {/* Timer */}
            <div className="text-center mb-4">
              <div className="text-gray-400 text-sm mb-1">Time Remaining</div>
              <div
                className={`text-4xl font-mono font-bold ${getTimerColor(
                  auctionState.timeRemaining
                )}`}
              >
                {formatTime(auctionState.timeRemaining)}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                {auctionState.status === "active"
                  ? "LIVE AUCTION"
                  : auctionState.status === "ended"
                  ? "ENDED"
                  : "WAITING"}
              </div>
            </div>

            {/* Current Bid */}
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-1">Current Bid</div>
              {auctionState.currentBid ? (
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    ${auctionState.currentBid.amount.toLocaleString()}
                  </div>
                  <div className="text-yellow-400 text-sm">
                    by {auctionState.currentBid.bidder}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-gray-400">
                    No bids yet
                  </div>
                  <div className="text-gray-500 text-sm">
                    Starting at $
                    {auctionState.item.startingPrice.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Next Bid Info */}
            {auctionState.status === "active" && (
              <div className="mt-4 pt-4 border-t border-gray-600 text-center">
                <div className="text-gray-400 text-xs">Minimum next bid</div>
                <div className="text-blue-400 font-bold">
                  ${getMinBid().toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
