import { createFileRoute, Link } from "@tanstack/react-router";

import { useAuctionConnection } from "@/hooks/useAuctionConnection";
import { useAuctionParticipation } from "@/hooks/useAuctionParticipation";
import { useAuctionMessages } from "@/hooks/useAuctionMessages";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { UserLogin } from "@/components/UserLogin";
import { CurrentAuction } from "@/components/CurrentAuction";
import { BiddingInterface } from "@/components/BiddingInterface";
import { NotificationsFeed } from "@/components/NotificationsFeed";
import { AuctionHistory } from "@/components/AuctionHistory";

export const Route = createFileRoute("/")({
  component: AuctionHouse,
});

function AuctionHouse() {
  const {
    isConnected,
    isConnecting,
    connectionStatus,
    error,
    api,
    connect,
    disconnect,
  } = useAuctionConnection();

  const {
    username,
    isJoined,
    auctionState,
    auctionHistory,
    setUsername,
    joinAuction,
    leaveAuction,
    placeBid,
    updateAuctionState,
    setAuctionHistory,
  } = useAuctionParticipation(api);

  const { notifications, addNotification, clearNotifications } =
    useAuctionMessages(
      api,
      isConnected,
      isJoined,
      updateAuctionState,
      setAuctionHistory,
      auctionState.item?.name
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🏛️ Galactic Auction House 🏛️
          </h1>
          <p className="text-gray-400 mb-4">
            Real-time bidding on legendary sci-fi movie memorabilia
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link
              to="/"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Back to Home
            </Link>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">Powered by Cap'n Web RPC</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Auction Interface */}
          <div className="xl:col-span-2 space-y-6">
            <ConnectionStatus
              isConnected={isConnected}
              isConnecting={isConnecting}
              connectionStatus={connectionStatus}
              error={error}
              onConnect={connect}
              onDisconnect={disconnect}
            />

            <UserLogin
              username={username}
              isJoined={isJoined}
              isConnected={isConnected}
              onUsernameChange={setUsername}
              onJoinAuction={joinAuction}
              onLeaveAuction={leaveAuction}
              onAddNotification={addNotification}
            />

            <CurrentAuction auctionState={auctionState} />

            <BiddingInterface
              auctionState={auctionState}
              isJoined={isJoined}
              onPlaceBid={placeBid}
              onAddNotification={addNotification}
            />
          </div>

          {/* Right Column - Activity & History */}
          <div className="space-y-6">
            <NotificationsFeed
              notifications={notifications}
              onClearNotifications={clearNotifications}
            />

            <AuctionHistory auctionHistory={auctionHistory} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <div className="mb-2">
            🚀 Built with{" "}
            <a
              href="https://github.com/cloudflare/capnweb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Cap'n Web RPC
            </a>{" "}
            &{" "}
            <a
              href="https://tanstack.com/start"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              TanStack Start
            </a>
          </div>
          <div className="text-xs text-gray-500">
            Experience the future of bidirectional web communication
          </div>
        </div>
      </div>
    </div>
  );
}
