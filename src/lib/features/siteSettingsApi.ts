import { apiSlice } from "./apiSlice";

const siteSettingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSiteSettings: builder.query({
      query: () => "/api/site-settings",
      providesTags: ["SiteSettings"],
    }),
    updateSiteSettings: builder.mutation({
      query: (settings) => ({
        url: "/api/site-settings",
        method: "PATCH",
        body: settings,
      }),
      invalidatesTags: ["SiteSettings"],
    }),
  }),
});

export const { useGetSiteSettingsQuery, useUpdateSiteSettingsMutation } =
  siteSettingApiSlice;
