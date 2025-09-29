import { useState, useCallback } from "react";
import type { AuctionAPI } from "./useAuctionConnection";

export interface AuctionItem {
  id: string;
  name: string;
  description: string;
  movie: string;
  startingPrice: number;
  rarity: "common" | "rare" | "legendary";
}

export interface CurrentBid {
  amount: number;
  bidder: string;
  timestamp: string;
}

export interface AuctionState {
  item: AuctionItem | null;
  currentBid: CurrentBid | null;
  timeRemaining: number;
  status: "waiting" | "active" | "ended";
  bidCount: number;
}

export interface ParticipationState {
  username: string;
  isJoined: boolean;
  auctionState: AuctionState;
  auctionHistory: any[];
}

export function useAuctionParticipation(api: AuctionAPI | null) {
  const [state, setState] = useState<ParticipationState>({
    username: "",
    isJoined: false,
    auctionState: {
      item: null,
      currentBid: null,
      timeRemaining: 0,
      status: "waiting",
      bidCount: 0,
    },
    auctionHistory: [],
  });

  const setUsername = useCallback((username: string) => {
    setState((prev) => ({ ...prev, username }));
  }, []);

  const joinAuction = useCallback(async () => {
    if (!api || !state.username.trim()) return false;

    try {
      // Use a simple dummy callback since we're using polling
      const dummyCallback = () => "polling-based";
      const result = await api.joinAuction(state.username, dummyCallback);
      console.log("Joined auction:", result);

      setState((prev) => ({ ...prev, isJoined: true }));

      // Get current auction state and history
      const [currentAuction, history] = await Promise.all([
        api.getCurrentAuction(),
        api.getAuctionHistory(),
      ]);

      setState((prev) => ({
        ...prev,
        auctionState: currentAuction || prev.auctionState,
        auctionHistory: history || [],
      }));

      return true;
    } catch (error) {
      console.error("Failed to join auction:", error);
      return false;
    }
  }, [api, state.username]);

  const leaveAuction = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isJoined: false,
    }));
  }, []);

  const placeBid = useCallback(
    async (amount: number): Promise<boolean> => {
      if (!api || !state.isJoined) return false;

      try {
        await api.placeBid(amount);
        return true;
      } catch (error) {
        console.error("Failed to place bid:", error);
        return false;
      }
    },
    [api, state.isJoined]
  );

  const updateAuctionState = useCallback((updates: Partial<AuctionState>) => {
    setState((prev) => ({
      ...prev,
      auctionState: { ...prev.auctionState, ...updates },
    }));
  }, []);

  const setAuctionHistory = useCallback((history: any[]) => {
    setState((prev) => ({ ...prev, auctionHistory: history }));
  }, []);

  return {
    ...state,
    setUsername,
    joinAuction,
    leaveAuction,
    placeBid,
    updateAuctionState,
    setAuctionHistory,
  };
}
