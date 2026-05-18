import { Prisma } from "@prisma/client";

export interface UsersFetchInput {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UsersFetchOutput {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  users: Prisma.UserGetPayload<{
    select: {
      id: true;
      playerId: true;
      phone: true;
      isBanned: true;
      createdAt: true;
      wallet: {
        select: {
          balance: true;
          currency: true;
        };
      };
    };
  }>[];
}

export interface FetchUserOutput {
  success: boolean;
  user: Prisma.UserGetPayload<{ include: { wallet: true } }>;
  financialOverview: {
    totalDeposits: number;
    totalWithdraws: number;
    lastDeposits: number;
    lastWithdraws: number;
  };
  bettingStatistics: {
    totalBet: number;
    totalWin: number;
    totalLosss: number;
    winRate: number;
  };
  latestTransactions: any[];
}
export interface UserSuspensionInput {
  id: string;
  actionType: "BAN" | "UNBAN";
}
