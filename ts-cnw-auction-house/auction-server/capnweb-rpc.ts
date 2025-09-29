// Cap'n Web RPC server implementation with message queue system
import { RpcTarget } from "capnweb";
import { WebSocket } from "ws";
import { AuctionLogic } from "./auction-logic.js";

// Global shared auction instance
export const globalAuction = new AuctionLogic({
  async onAuctionStart(item, duration) {
    await AuctionServer.broadcastViaMessageQueue({
      type: "auction_start",
      message: `NEW AUCTION: ${item.name} from ${item.movie}!`,
      item,
      duration,
      className: "bg-purple-800 border-purple-400",
    });
  },

  async onTimerUpdate(timeRemaining) {
    // Send timer updates every 10 seconds, or every second in last 10 seconds
    if (timeRemaining % 10 === 0 || timeRemaining <= 10) {
      await AuctionServer.broadcastViaMessageQueue({
        type: "timer_update",
        message: `${timeRemaining} seconds remaining`,
        timeRemaining,
      });
    }
  },

  async onAuctionEnd(winner, finalPrice) {
    if (winner && finalPrice) {
      await AuctionServer.broadcastViaMessageQueue({
        type: "auction_end",
        message: `SOLD! Goes to ${winner} for $${finalPrice.toLocaleString()}!`,
        winner,
        finalPrice,
        className: "bg-green-800 border-green-400",
      });
    } else {
      await AuctionServer.broadcastViaMessageQueue({
        type: "auction_end",
        message: "No bids received. Item will return later.",
        className: "bg-gray-700 border-gray-400",
      });
    }
  },

  async onBidUpdate(currentBid, bidCount) {
    await AuctionServer.broadcastViaMessageQueue({
      type: "bid_update",
      message: `${
        currentBid.bidder
      } bid $${currentBid.amount.toLocaleString()}!`,
      currentBid,
      bidCount,
      className:
        currentBid.amount >= 50000
          ? "bg-yellow-800 border-yellow-400"
          : "bg-green-800 border-green-400",
    });
  },
});

// Global registry of active RPC server instances
export const activeServers = new Set<AuctionServer>();

// Global registry of WebSocket connections for direct broadcasting
export const activeWebSockets = new Map<string, WebSocket>();

// Message queue system for each user
export const userMessageQueues = new Map<string, Array<any>>();

// Global registry of client callbacks for counting
export const clients = new Map<string, Function>();

// Auction Server Implementation (one per connection)
export class AuctionServer extends RpcTarget {
  public currentUsername: string | null = null;
  private webSocket: WebSocket | null = null;

  constructor() {
    super();
    // Initialize the shared auction system if not already done
    globalAuction.initialize();

    // Register this server instance
    activeServers.add(this);
    console.log(`📡 Registered new RPC server. Total: ${activeServers.size}`);
  }

  // Set the WebSocket connection for this server instance
  setWebSocket(ws: WebSocket) {
    this.webSocket = ws;

    // Handle WebSocket disconnection
    ws.on("close", () => {
      if (this.currentUsername) {
        activeWebSockets.delete(this.currentUsername);
        console.log(`🔌 WebSocket disconnected for ${this.currentUsername}`);
      }
      this.dispose();
    });
  }

  // Message queue-based broadcasting (avoids RPC cross-session issues)
  static async broadcastViaMessageQueue(
    notification: any,
    excludeUser?: string
  ) {
    console.log(`📬 Broadcasting via message queue to registered users`);

    let successCount = 0;
    const successful: string[] = [];

    for (const username of clients.keys()) {
      if (excludeUser && username === excludeUser) {
        continue;
      }

      // Add notification to user's message queue
      if (!userMessageQueues.has(username)) {
        userMessageQueues.set(username, []);
      }

      const queue = userMessageQueues.get(username)!;
      queue.push({
        ...notification,
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9),
      });

      // Keep queue size manageable (last 50 messages)
      if (queue.length > 50) {
        queue.splice(0, queue.length - 50);
      }

      successCount++;
      successful.push(username);
      console.log(`✅ Message queued for ${username}`);
    }

    console.log(
      `📬 Message queue broadcast: ${successCount} users notified (${successful.join(
        ", "
      )})`
    );
    return { successful, failed: [], successCount, failedCount: 0 };
  }

  // Cleanup when connection closes
  dispose() {
    activeServers.delete(this);
    if (this.currentUsername) {
      clients.delete(this.currentUsername);
      userMessageQueues.delete(this.currentUsername);
    }
    console.log(`📡 Unregistered RPC server. Total: ${activeServers.size}`);
  }

  // Client joins the auction
  async joinAuction(username: string, notificationCallback: Function) {
    console.log(`${username} joined the auction`);
    this.currentUsername = username;

    // Store callback locally in this server instance
    this.clientCallback = notificationCallback;

    // Register WebSocket in global map for direct broadcasting
    if (this.webSocket) {
      activeWebSockets.set(username, this.webSocket);
      console.log(
        `🔌 Registered WebSocket for ${username}. Total: ${activeWebSockets.size}`
      );
    }

    // Track in global state for counting
    clients.set(username, notificationCallback);

    // Send welcome notification via message queue
    await AuctionServer.broadcastViaMessageQueue({
      type: "welcome",
      message: `Welcome ${username}! Get ready for legendary sci-fi treasures!`,
      className: "bg-blue-800 border-blue-400",
    });

    // Broadcast that someone joined
    await this.broadcastToAllServers(
      {
        type: "user_joined",
        message: `${username} entered the auction house`,
        className: "bg-gray-700 border-gray-400",
      },
      username
    );

    return {
      message: "Successfully joined the auction",
      activeUsers: activeServers.size,
    };
  }

  // Broadcast method that works across RPC sessions
  async broadcastToAllServers(notification: any, excludeUser?: string) {
    return await AuctionServer.broadcastViaMessageQueue(
      notification,
      excludeUser
    );
  }

  // Get current auction state
  getCurrentAuction() {
    return globalAuction.getCurrentState();
  }

  // Get auction history
  getAuctionHistory() {
    return globalAuction.getHistory();
  }

  // Poll for new messages from the queue
  async pollMessages() {
    if (!this.currentUsername) {
      return [];
    }

    const queue = userMessageQueues.get(this.currentUsername) || [];
    const messages = [...queue]; // Return copy

    // Clear the queue after reading
    userMessageQueues.set(this.currentUsername, []);

    if (messages.length > 0) {
      console.log(
        `📨 ${this.currentUsername} polling: returning ${messages.length} messages`
      );
    }

    return messages;
  }

  // Place a bid
  async placeBid(amount: number) {
    const bidder = this.currentUsername || "Anonymous";

    const result = await globalAuction.placeBid(bidder, amount);

    if (!result.success) {
      throw new Error(result.error || "Bid failed");
    }

    // Check if timer was extended (this logic is now in AuctionLogic)
    const currentState = globalAuction.getCurrentState();
    if (currentState.timeRemaining > 90) {
      // If time was extended
      await this.broadcastToAllServers({
        type: "timer_extended",
        message: `Time extended! ${currentState.timeRemaining} seconds remaining.`,
        timeRemaining: currentState.timeRemaining,
        className: "bg-orange-800 border-orange-400",
      });
    }

    return {
      message: "Bid placed successfully",
      currentBid: currentState.currentBid,
      timeRemaining: currentState.timeRemaining,
    };
  }
}
