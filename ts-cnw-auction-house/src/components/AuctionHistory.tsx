interface AuctionHistoryProps {
  auctionHistory: any[];
}

export function AuctionHistory({ auctionHistory }: AuctionHistoryProps) {
  if (auctionHistory.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <span>📚</span>
          <span>Auction History</span>
        </h3>
        <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-3">📋</div>
          <div>No completed auctions yet</div>
          <div className="text-sm mt-1">
            History of sold items will appear here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
        <span>📚</span>
        <span>Auction History</span>
        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
          {auctionHistory.length}
        </span>
      </h3>

      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {auctionHistory.map((item, index) => (
          <div
            key={index}
            className="bg-gray-700 p-4 rounded-lg border border-gray-600"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-white mb-1">{item.name}</div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-green-400">
                    <span className="text-gray-400">Sold for:</span>
                    <span className="font-bold ml-1">
                      ${item.finalPrice?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="text-yellow-400">
                    <span className="text-gray-400">Winner:</span>
                    <span className="font-bold ml-1">{item.winner}</span>
                  </div>
                </div>
              </div>
              <div className="text-2xl">🏆</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="text-center text-gray-400 text-sm">
          <div className="flex items-center justify-center space-x-4">
            <div>
              <span className="font-bold text-white">
                {auctionHistory.length}
              </span>
              <span className="ml-1">Items Sold</span>
            </div>
            <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
            <div>
              <span className="font-bold text-white">
                $
                {auctionHistory
                  .reduce((total, item) => total + (item.finalPrice || 0), 0)
                  .toLocaleString()}
              </span>
              <span className="ml-1">Total Sales</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
