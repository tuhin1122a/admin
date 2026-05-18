import { apiSlice } from "./apiSlice";
import {
  FetchUserOutput,
  UsersFetchInput,
  UsersFetchOutput,
  UserSuspensionInput,
} from "@/type/user";

const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    fetchUsers: builder.query<UsersFetchOutput, UsersFetchInput>({
      query: (params) => ({
        url: `/api/users?search=${params.search}&status=${params.status}&page=${params.page}&limit=${params.limit}`,
        method: "GET",
      }),
      providesTags: ["users"],
    }),

    fetchUser: builder.query<FetchUserOutput, { id: string }>({
      query: ({ id }) => ({
        url: `/api/users/${id}`,
        method: "GET",
      }),
      providesTags: ["users"],
    }),

    suspension: builder.mutation<{ success: true }, UserSuspensionInput>({
      query: ({ id, actionType }) => ({
        url: `/api/users/${id}/suspension`,
        method: "PUT",
        body: { actionType },
      }),
      invalidatesTags: ["users"],
    }),

    searchUsers: builder.query({
      query: (query: string) => `/api/add-balance?query=${query}`,
    }),
  }),
});

export const {
  useFetchUsersQuery,
  useFetchUserQuery,
  useSuspensionMutation,
  useSearchUsersQuery,
} = usersApiSlice;
