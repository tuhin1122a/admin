export type RevenuePayoutStat = {
  date: string;
  revenue: number;
  payouts: number;
};

export type DepositsWithdrawalsStat = {
  filter: string;
  from: string;
  to: string;
  data: {
    date: string;
    deposits: number;
    withdraws: number;
    revenue: number;
  }[];
};

export type RecentTransaction = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  } | null;
};

export type PeriodStats = {
  last7Days: number;
  last30Days: number;
  allTime: number;
};

export type DashboardOverviewResponse = {
  totalUsers: PeriodStats;
  activeUsers: PeriodStats;
  bannedUsers: PeriodStats;
  totalRevenue: PeriodStats;
  payoutsIssued: PeriodStats;
  pendingWithdrawals: PeriodStats;
  successDeposits: PeriodStats;
  conversionRate: number;
  revenue: number;
  depositWithdraw: DepositsWithdrawalsStat;
  recentTransactions: RecentTransaction[];
  filteredData?: {
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    totalRevenue: number;
    payoutsIssued: number;
    pendingWithdrawals: number;
    successDeposits: number;
  };
};

export type DashboardOverviewQueryParams = {
  startDate?: string;
  endDate?: string;
  paymentFilter?: string;
};
