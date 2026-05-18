"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import moment from "moment";
import CookieLoader from "@/components/loaders/cookie-loader";
import { TableSkeletonLoader } from "@/components/loaders/table-loader";
import { useFetchUsersQuery } from "@/lib/features/usersApiSlice";
import Link from "next/link";

const Users: React.FC = () => {
  const [filter, setFilter] = useState({
    limit: 10,
    search: "",
    status: "all",
    page: 1,
  });

  const { data, isLoading, isFetching } = useFetchUsersQuery(filter);
  console.log("Data = ", data);
  const users = data?.users;
  const totalFound = data?.total;

  const handleChangeFilterValues = (name: string, value: any) => {
    setFilter((state) => ({ ...state, [name]: value }));
  };

  const renderStatusBadge = (isBanned: boolean) => {
    switch (isBanned) {
      case true:
        return <Badge className="bg-red-500 hover:bg-red-600">Banned</Badge>;
      case false:
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
        );
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const renderTableContent = () => {
    if (isFetching) return <TableSkeletonLoader />;
    return (
      <>
        <div className="overflow-x-auto border rounded-md">
          <Table className="  ">
            <TableHeader>
              <TableRow>
                <TableHead>Player ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Bet</TableHead>
                <TableHead>Total Win Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id} className="">
                  <TableCell>{user.playerId}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{moment(user.createdAt).calendar()}</TableCell>
                  <TableCell>{renderStatusBadge(user.isBanned)}</TableCell>
                  <TableCell>৳0.00</TableCell>
                  <TableCell>0.00%</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/users/${user.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="!rounded-button whitespace-nowrap cursor-pointer"
                      >
                        <i className="fas fa-eye mr-1"></i> View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    No users found matching your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="px-6 py-4 flex items-center justify-between ">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{users?.length || 0}</span> of{" "}
            <span className="font-medium">{totalFound}</span> users
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={users?.length == 0 || filter.page == 1}
              onClick={() => handleChangeFilterValues("page", filter.page - 1)}
              className="!rounded-button whitespace-nowrap cursor-pointer"
            >
              <i className="fas fa-chevron-left mr-1"></i> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                users?.length == 0 ||
                Math.ceil(totalFound! / filter.limit) == filter.page
              }
              onClick={() => handleChangeFilterValues("page", filter.page + 1)}
              className="!rounded-button whitespace-nowrap cursor-pointer"
            >
              Next <i className="fas fa-chevron-right ml-1"></i>
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {data && !isLoading && (
        <div className="">
          <main className="max-w-7xl mx-auto">
            {/* Tabs and Data */}
            <div className=" shadow rounded-lg overflow-hidden">
              {/* Filters */}
              <div className=" py-4  ">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search" className="text-sm font-medium">
                      Search
                    </Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fas fa-search text-gray-400"></i>
                      </div>
                      <Input
                        id="search"
                        type="text"
                        placeholder="Phone, Player ID..."
                        className="pl-10"
                        value={filter.search}
                        onChange={(e) =>
                          handleChangeFilterValues("search", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="payment-gateway"
                      className="text-sm font-medium"
                    >
                      Status
                    </Label>
                    <Select
                      value={filter.status}
                      onValueChange={(value) =>
                        handleChangeFilterValues("status", value)
                      }
                    >
                      <SelectTrigger id="payment-gateway" className="mt-1">
                        <SelectValue placeholder="All Gateways" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={"all"} className="capitalize">
                          All
                        </SelectItem>
                        <SelectItem value={"unbanned"} className="capitalize">
                          Acive
                        </SelectItem>
                        <SelectItem value={"banned"} className="capitalize">
                          Banned
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>{renderTableContent()}</div>
            </div>
          </main>
        </div>
      )}

      {(!data || isLoading) && (
        <div className="flex w-full h-[85vh] justify-center items-center">
          <CookieLoader />
        </div>
      )}
    </>
  );
};

export default Users;
