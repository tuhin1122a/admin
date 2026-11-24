

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
  canDeposit?: boolean;
  canWithdraw?: boolean;
  canPlayGame?: boolean;
  canClaimBonus?: boolean;
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
  bonuses?: {
    dailyBonus: number;
    referralBonus: number;
    spinBonus: number;
    totalBonuses: number;
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

export interface BonusBreakdown {
  dailyBonus: number;
  dailyBonusCount: number;
  referralBonus: number;
  referralBonusCount: number;
  spinBonus: number;
  spinBonusCount: number;
  totalBonuses: number;
}

export interface BalanceAudit {
  currentBalance: number;
  totalDeposits: number;
  totalWithdraws: number;
  totalBonuses: number;
  totalBet: number;
  totalWin: number;
  totalLoss: number;
  netGamingResult: number;
  estimatedInflow: number;
  estimatedOutflow: number;
}

export interface GameSessionItem {
  id: string;
  userId: string;
  gameUid: string;
  gameName: string;
  provider?: string | null;
  startBalance: number;
  endBalance: number | null;
  netProfit: number | null;
  totalBet: number;
  totalWin: number;
  roundsCount: number;
  status: "ACTIVE" | "COMPLETED" | string;
  startedAt: string;
  endedAt?: string | null;
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
  bonusBreakdown?: BonusBreakdown;
  balanceAudit?: BalanceAudit;
  gameSessions?: GameSessionItem[];
  latestTransactions: any[];
  betHistory?: BetHistoryItem[];
}
export interface UserSuspensionInput {
  id: string;
  actionType: "BAN" | "UNBAN";
}
