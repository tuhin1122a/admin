import { PaymentWalletType, Prisma } from "@prisma/client";

export interface WalletCreateInput {
  walletLogo: string;
  walletName: string;
  wallets: string[];
  isActive?: boolean;
  walletType: PaymentWalletType;
}
export interface WalletUpdateInput {
  id: string;
  wallets?: string[];
  isActive?: boolean;
  trxType: string;
  minDeposit: number;
  maxDeposit: number;
  instructions?: string;
  warning?: string;
}
export type ExtenedDepositWallet = Prisma.DepositWalletGetPayload<object> & {
  paymentWallet: Prisma.PaymentWalletGetPayload<object>;
};
export interface WalletFetchOutput {
  data: {
    wallets: ExtenedDepositWallet[];
  };
}

export type ExtenedDeposit = Prisma.DepositGetPayload<{
  include: { user: true };
}> & {
  wallet: ExtenedDepositWallet;
};

export interface DepostisFetchInput {
  search?: string;
  from?: string;
  to?: string;
  gateway: string;
  minAmount?: number;
  maxAmount?: number;
  status?: any;
  limit?: number;
  page?: number;
}
export type ExtenedCard = Prisma.CardGetPayload<{
  include: { container: true };
}> & {
  paymentWallet: Prisma.PaymentWalletGetPayload<object>;
};

export interface DepostisFetchOutput {
  success: boolean;
  data: {
    totalFound: number;
    limit: number;
    deposits: ExtenedDeposit[];
    paymentWallets: Prisma.PaymentWalletGetPayload<object>[];
  };
}

export interface DepositApprovalInput {
  depositId: string;
  message?: string;
  actionType: "approve" | "reject";
}

export interface WithdrawsFetchInput {
  search?: string;
  from?: string;
  to?: string;
  card: string;
  minAmount?: number;
  maxAmount?: number;
  status?: any;
  limit?: number;
  page?: number;
}
export type ExtenedWithdraw = Prisma.WithdrawGetPayload<{
  include: { user: true };
}> & {
  card: ExtenedCard;
};

export interface WithdrawsFetchOutput {
  success: boolean;
  data: {
    totalFound: number;
    limit: number;
    withdraws: ExtenedWithdraw[];
    paymentWallets: Prisma.PaymentWalletGetPayload<object>[];
  };
}

export interface WithdrawApprovalInput {
  withdrawId: string;
  message?: string;
  actionType: "approve" | "reject";
}
