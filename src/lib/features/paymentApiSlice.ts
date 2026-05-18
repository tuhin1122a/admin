import {
  DepositApprovalInput,
  DepostisFetchInput,
  DepostisFetchOutput,
  WalletCreateInput,
  WalletFetchOutput,
  WalletUpdateInput,
  WithdrawApprovalInput,
  WithdrawsFetchInput,
  WithdrawsFetchOutput,
} from "@/type/payment";
import { apiSlice } from "./apiSlice";

const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createWallet: builder.mutation<{ success: true }, WalletCreateInput>({
      query: (body) => ({
        url: `/api/payment/wallet`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["wallet"],
    }),

    fetchWallets: builder.query<WalletFetchOutput, void>({
      query: () => ({
        url: `/api/payment/wallet`,
        method: "GET",
      }),
      providesTags: ["wallet"],
    }),

    updateWallets: builder.mutation<{ success: boolean }, WalletUpdateInput>({
      query: (body) => ({
        url: `/api/payment/wallet`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["wallet"],
    }),

    deleteWallet: builder.mutation<{ success: boolean }, { id: string }>({
      query: (body) => ({
        url: `/api/payment/wallet`,
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["wallet"],
    }),

    fetchDeposts: builder.query<DepostisFetchOutput, DepostisFetchInput>({
      query: (params) => ({
        url: `/api/payment/deposits?search=${params.search}&from=${params.from}&to=${params.to}&gateway=${params.gateway}&minAmount=${params.minAmount}&maxAmount=${params.maxAmount}&status=${params.status}&limit=${params.limit}?page=${params.page}`,
        method: "GET",
      }),
      providesTags: ["deposits"],
    }),
    approvalDeposit: builder.mutation<{ success: true }, DepositApprovalInput>({
      query: (body) => ({
        url: "/api/payment/deposits",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["deposits"],
    }),

    fetchWithdraws: builder.query<WithdrawsFetchOutput, WithdrawsFetchInput>({
      query: (params) => ({
        url: `/api/payment/withdraws?search=${params.search}&from=${params.from}&to=${params.to}&card=${params.card}&minAmount=${params.minAmount}&maxAmount=${params.maxAmount}&status=${params.status}&limit=${params.limit}?page=${params.page}`,
        method: "GET",
      }),
      providesTags: ["withdraws"],
    }),
    approvalWithdraw: builder.mutation<
      { success: true },
      WithdrawApprovalInput
    >({
      query: (body) => ({
        url: "/api/payment/withdraws",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["withdraws"],
    }),
  }),
});

export const {
  useCreateWalletMutation,
  useFetchWalletsQuery,
  useUpdateWalletsMutation,
  useDeleteWalletMutation,
  useFetchDepostsQuery,
  useApprovalDepositMutation,
  useFetchWithdrawsQuery,
  useApprovalWithdrawMutation,
} = dashboardApiSlice;
