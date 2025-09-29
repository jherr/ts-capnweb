// Core auction business logic and data structures

// Sci-Fi Memorabilia Auction Items
export const AUCTION_ITEMS = [
  {
    id: "luke-lightsaber",
    name: "Luke Skywalker's Lightsaber",
    description:
      "The iconic blue lightsaber wielded by Luke Skywalker in The Empire Strikes Back. Complete with authentic battle damage and force resonance.",
    movie: "Star Wars: The Empire Strikes Back",
    startingPrice: 50000,
    rarity: "legendary" as const,
  },
  {
    id: "tricorder-tos",
    name: "Original Series Tricorder",
    description:
      "Spock's personal tricorder from the original Star Trek series. Fully functional scanning capabilities for 23rd century technology.",
    movie: "Star Trek: The Original Series",
    startingPrice: 25000,
    rarity: "rare" as const,
  },
  {
    id: "replicant-badge",
    name: "Blade Runner Police Badge",
    description:
      "Rick Deckard's LAPD badge from Blade Runner circa 2019. Includes encrypted access to the Tyrell Corporation database.",
    movie: "Blade Runner",
    startingPrice: 15000,
    rarity: "rare" as const,
  },
  {
    id: "neo-pills",
    name: "The Red and Blue Pills",
    description:
      "Morpheus's choice pills from The Matrix. Sealed in original quantum-encrypted containers. Choose wisely.",
    movie: "The Matrix",
    startingPrice: 100000,
    rarity: "legendary" as const,
  },
  {
    id: "phaser-kirk",
    name: "Captain Kirk's Phaser",
    description:
      "Type-2 phaser used by Captain James T. Kirk. Set to stun, but packs a punch that can take down a Klingon warrior.",
    movie: "Star Trek: The Original Series",
    startingPrice: 30000,
    rarity: "rare" as const,
  },
  {
    id: "flux-capacitor",
    name: "Flux Capacitor",
    description:
      "The legendary flux capacitor that makes time travel possible. From Doc Brown's DeLorean. 1.21 gigawatts not included.",
    movie: "Back to the Future",
    startingPrice: 75000,
    rarity: "legendary" as const,
  },
];

export interface AuctionBid {
  amount: number;
  bidder: string;
  timestamp: string;
}

export interface AuctionState {
  item: (typeof AUCTION_ITEMS)[0] | null;
  currentBid: AuctionBid | null;
  timeRemaining: number;
  status: "waiting" | "active" | "ended";
  bidCount: number;
  startTime: number;
}

export interface AuctionHistoryItem {
  name: string;
  finalPrice: number;
  winner: string;
}

// Core auction business logic class
export class AuctionLogic {
  public auctionState: AuctionState = {
    item: null,
    currentBid: null,
    timeRemaining: 0,
    status: "waiting",
    bidCount: 0,
    startTime: 0,
  };

  public auctionHistory: AuctionHistoryItem[] = [];
  private currentItemIndex = 0;
  private auctionTimer: NodeJS.Timeout | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  // Event callbacks
  private onAuctionStart?: (item: any, duration: number) => Promise<void>;
  private onTimerUpdate?: (timeRemaining: number) => Promise<void>;
  private onAuctionEnd?: (
    winner: string | null,
    finalPrice: number | null
  ) => Promise<void>;
  private onBidUpdate?: (
    currentBid: AuctionBid,
    bidCount: number
  ) => Promise<void>;

  constructor(callbacks?: {
    onAuctionStart?: (item: any, duration: number) => Promise<void>;
    onTimerUpdate?: (timeRemaining: number) => Promise<void>;
    onAuctionEnd?: (
      winner: string | null,
      finalPrice: number | null
    ) => Promise<void>;
    onBidUpdate?: (currentBid: AuctionBid, bidCount: number) => Promise<void>;
  }) {
    this.onAuctionStart = callbacks?.onAuctionStart;
    this.onTimerUpdate = callbacks?.onTimerUpdate;
    this.onAuctionEnd = callbacks?.onAuctionEnd;
    this.onBidUpdate = callbacks?.onBidUpdate;
  }

  initialize() {
    if (this.initialized) return;

    console.log("🚀 Starting shared auction system...");
    this.initialized = true;

    // Start the first auction after a brief delay
    setTimeout(() => this.startNewAuction(), 3000);
  }

  async startNewAuction() {
    // Clear any existing timers
    if (this.auctionTimer) clearTimeout(this.auctionTimer);
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Get the next item
    const item = AUCTION_ITEMS[this.currentItemIndex % AUCTION_ITEMS.length];
    this.currentItemIndex++;

    console.log(`Starting auction for: ${item.name}`);

    // Set up auction state
    this.auctionState = {
      item,
      currentBid: null,
      timeRemaining: 120, // 2 minutes
      status: "active",
      bidCount: 0,
      startTime: Date.now(),
    };

    // Notify about auction start
    if (this.onAuctionStart) {
      await this.onAuctionStart(item, 120);
    }

    // Start countdown timer
    this.startCountdown();

    // Auto-end auction after 2 minutes
    this.auctionTimer = setTimeout(() => this.endAuction(), 120000);
  }

  private startCountdown() {
    this.timerInterval = setInterval(async () => {
      if (this.auctionState.timeRemaining > 0) {
        this.auctionState.timeRemaining--;

        // Notify about timer update
        if (this.onTimerUpdate) {
          await this.onTimerUpdate(this.auctionState.timeRemaining);
        }
      }
    }, 1000);
  }

  async endAuction() {
    if (this.auctionTimer) clearTimeout(this.auctionTimer);
    if (this.timerInterval) clearInterval(this.timerInterval);

    console.log("🏁 Auction ended!");

    this.auctionState.status = "ended";
    this.auctionState.timeRemaining = 0;

    const winner = this.auctionState.currentBid?.bidder || null;
    const finalPrice = this.auctionState.currentBid?.amount || null;

    // Add to history if there was a winning bid
    if (winner && finalPrice && this.auctionState.item) {
      this.auctionHistory.push({
        name: this.auctionState.item.name,
        finalPrice,
        winner,
      });
    }

    // Notify about auction end
    if (this.onAuctionEnd) {
      await this.onAuctionEnd(winner, finalPrice);
    }

    // Start next auction in 10 seconds
    setTimeout(() => this.startNewAuction(), 10000);
  }

  async placeBid(
    bidder: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    if (this.auctionState.status !== "active" || !this.auctionState.item) {
      return { success: false, error: "No active auction" };
    }

    const minBid = this.auctionState.currentBid
      ? this.auctionState.currentBid.amount + 1000
      : this.auctionState.item.startingPrice;

    if (amount < minBid) {
      return {
        success: false,
        error: `Bid must be at least $${minBid.toLocaleString()}`,
      };
    }

    // Update bid
    this.auctionState.currentBid = {
      amount,
      bidder,
      timestamp: new Date().toISOString(),
    };
    this.auctionState.bidCount++;

    console.log(`💰 New bid: $${amount.toLocaleString()} by ${bidder}`);

    // Extend time if less than 30 seconds remaining
    if (this.auctionState.timeRemaining < 30) {
      const extension = 30;
      this.auctionState.timeRemaining += extension;

      // Restart auction timer with extended time
      if (this.auctionTimer) clearTimeout(this.auctionTimer);
      this.auctionTimer = setTimeout(
        () => this.endAuction(),
        this.auctionState.timeRemaining * 1000
      );

      console.log(`⏰ Timer extended by ${extension} seconds due to late bid`);
    }

    // Notify about bid update
    if (this.onBidUpdate) {
      await this.onBidUpdate(
        this.auctionState.currentBid,
        this.auctionState.bidCount
      );
    }

    return { success: true };
  }

  getCurrentState(): AuctionState {
    return { ...this.auctionState };
  }

  getHistory(): AuctionHistoryItem[] {
    return [...this.auctionHistory];
  }

  dispose() {
    if (this.auctionTimer) clearTimeout(this.auctionTimer);
    if (this.timerInterval) clearInterval(this.timerInterval);
    console.log("🛑 Auction logic disposed");
  }
}
