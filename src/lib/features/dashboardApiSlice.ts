import {
  DashboardOverviewQueryParams,
  DashboardOverviewResponse,
} from "@/type/dashboard";
import { apiSlice } from "./apiSlice";

const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    fetchDashboard: builder.query<
      DashboardOverviewResponse,
      DashboardOverviewQueryParams
    >({
      query: ({ endDate, startDate, paymentFilter }) => ({
        url: `/api/dashboard/overview?startDate=${startDate}&endDate=${endDate}&payment-filter=${paymentFilter}&year=2025`,
        method: "GET",
      }),
    }),
  }),
});

export const { useFetchDashboardQuery } = dashboardApiSlice;
