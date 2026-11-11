import { Prisma } from "@prisma/client";

export interface UsersFetchInput {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserTableItem {
  id: string;
  playerId: string;
  phone: string;
  isBanned: boolean;
  createdAt: Date | string;
  wallet: {
    balance: number;
    currency: string;
    turnOver?: number;
  } | null;
  bettingRecord: {
    totalBet: number;
    totalWin: number;
    winRate: number;
  } | null;
  financials: {
    totalDeposit: number;
    totalWithdraw: number;
    netProfit: number;
  };
  gameStatus: {
    isPlaying: boolean;
    lastGameName?: string;
    lastActiveAt?: string;
  };
  subAdmin?: {
    id: string;
    name: string;
    agentCode: string;
  } | null;
}

export interface UsersFetchOutput {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  users: UserTableItem[];
}

export interface BetHistoryItem {
  serialNumber: string;
  gameUid: string;
  gameName: string;
  gameRound?: string;
  betAmount: number;
  winAmount: number;
  multiplier: number;
  creditAmount: number;
  status: "WIN" | "LOSS" | "REFUND";
  freeSpinBonus?: string;
  createdAt: string;
}

export interface FetchUserOutput {
  success: boolean;
  user: Prisma.UserGetPayload<{ include: { wallet: true } }>;
  financialOverview: {
    totalDeposits: number;
    totalWithdraws: number;
    lastDeposits: number;
    lastWithdraws: number;
    approvedDepositsCount: number;
  };
  bettingStatistics: {
    totalBet: number;
    totalWin: number;
    totalLosss: number;
    winRate: number;
  };
  latestTransactions: any[];
  betHistory?: BetHistoryItem[];
}
export interface UserSuspensionInput {
  id: string;
  actionType: "BAN" | "UNBAN";
}
