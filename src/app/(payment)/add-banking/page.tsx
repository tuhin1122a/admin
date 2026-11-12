"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDeleteWalletMutation,
  useFetchWalletsQuery,
} from "@/lib/features/paymentApiSlice";
import CookieLoader from "@/components/loaders/cookie-loader";
import { ExtenedDepositWallet } from "@/type/payment";
import { PaymentWalletType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import CreateGatewayModal from "./create-gateway-modal";
import UpdateGatewayModal from "./update-gateway-modal";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";

const BankingContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSubAdminId = searchParams.get("subAdminId") || undefined;

  const [scope, setScope] = useState<string>(urlSubAdminId || "default");

  useEffect(() => {
    setScope(urlSubAdminId || "default");
  }, [urlSubAdminId]);

  const queryArg =
    scope && scope !== "default" ? { subAdminId: scope } : undefined;
  const { data: wallets, isLoading } = useFetchWalletsQuery(queryArg);

  const isSubAdminView = Boolean(wallets?.data?.isSubAdminView);
  const targetSubAdmin = wallets?.data?.targetSubAdmin;
  const subAdmins = wallets?.data?.subAdmins || [];
  const templates = wallets?.data?.templates || [];

  const handleScopeChange = (nextScope: string) => {
    setScope(nextScope);
    if (nextScope === "default") {
      router.replace("/add-banking");
    } else {
      router.replace(`/add-banking?subAdminId=${encodeURIComponent(nextScope)}`);
    }
  };

  function getWalletByType(
    walletType: PaymentWalletType
  ): ExtenedDepositWallet[] {
    if (!wallets) return [];
    return wallets.data.wallets.filter(
      (wallet) => wallet.paymentWallet?.walletType === walletType
    );
  }

  const eWallets = getWalletByType("EWALLET");

  const hasActiveSubAdminNumbers = eWallets.some(
    (w) =>
      w.isActive &&
      Array.isArray(w.walletsNumber) &&
      w.walletsNumber.some((n) => String(n).trim().length > 0)
  );

  const [deleteWalletApi] = useDeleteWalletMutation();

  const handleDelete = (id: string) => {
    const confirmation = window.confirm("are you sure to delete?");
    if (!confirmation) return;
    const asyncAction = async () => {
      const response = await deleteWalletApi({
        id: id,
      }).unwrap();
      return response.success;
    };

    toast.promise(asyncAction(), {
      loading: "Deleting...",
      success: () => "Gateway Deleted",
      error: (error: any) => {
        if (error?.data?.error) {
          return `Error: ${error.data.error}`;
        } else {
          return INTERNAL_SERVER_ERROR;
        }
      },
    });
  };

  const getActiveCount = (data: ExtenedDepositWallet[]) => {
    return data.filter((item) => item.isActive).length;
  };

  const renderStatisticsBar = (data: ExtenedDepositWallet[]) => {
    const totalCount = data.length;
    const activeCount = getActiveCount(data);
    const inactiveCount = totalCount - activeCount;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Gateways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Gateways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Gateways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inactiveCount}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTable = (data: ExtenedDepositWallet[]) => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70px]">Image</TableHead>
              <TableHead>Name</TableHead>
              {!isSubAdminView && scope === "all" && (
                <TableHead>Owner / Agent</TableHead>
              )}
              <TableHead>Wallets Numbers</TableHead>
              <TableHead>Min / Max (৳)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Left Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((gateway) => (
              <TableRow key={gateway.id}>
                <TableCell>
                  {gateway.paymentWallet?.walletLogo ? (
                    <img
                      src={gateway.paymentWallet.walletLogo}
                      alt={gateway.paymentWallet.walletName}
                      className="w-10 h-10 object-contain rounded-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-gray-800 flex items-center justify-center text-xs font-bold">
                      {gateway.paymentWallet?.walletName?.slice(0, 2) || "PM"}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium capitalize">
                  {gateway.paymentWallet?.walletName || "Unknown"}
                  <span className="block text-[11px] text-gray-400">
                    {gateway.trxType}
                  </span>
                </TableCell>
                {!isSubAdminView && scope === "all" && (
                  <TableCell>
                    {gateway.subAdmin ? (
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 text-blue-300 border-blue-500/30 font-mono text-xs"
                      >
                        {gateway.subAdmin.agentCode || gateway.subAdmin.name}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-800 text-gray-300 border-gray-700 text-xs"
                      >
                        Default Site
                      </Badge>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[240px]">
                    {gateway.walletsNumber?.length > 0 ? (
                      gateway.walletsNumber.map((num, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="font-mono text-xs bg-gray-900 border-gray-700"
                        >
                          {num}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-red-400">No numbers</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono">
                  ৳{Number(gateway.minDeposit).toLocaleString()} - ৳
                  {Number(gateway.maximumDeposit).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span
                      className={`${
                        gateway.isActive ? "text-emerald-700" : "text-red-500"
                      } text-sm`}
                    >
                      {gateway.isActive ? "Active" : "InActive"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    title={
                      gateway.minDeposit &&
                      gateway.maximumDeposit &&
                      gateway.trxType
                        ? "Ready to manage Deposits"
                        : undefined
                    }
                    className={
                      gateway.minDeposit &&
                      gateway.maximumDeposit &&
                      gateway.trxType
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                    }
                  >
                    {gateway.minDeposit &&
                    gateway.maximumDeposit &&
                    gateway.trxType
                      ? "Ok"
                      : "Action Required"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <UpdateGatewayModal
                      label={{
                        image: gateway.paymentWallet?.walletLogo || "",
                        name: gateway.paymentWallet?.walletName || "",
                        wallets: gateway.walletsNumber,
                      }}
                      defaultValues={{
                        maxDeposit: gateway.maximumDeposit.toString(),
                        minDeposit: gateway.minDeposit.toString(),
                        trxType: gateway.trxType,
                        instructions: gateway.instructions,
                        isActive: gateway.isActive,
                        wallets: gateway.walletsNumber,
                        warning: gateway.warning?.toString(),
                      }}
                      id={gateway.id}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="!rounded-button cursor-pointer whitespace-nowrap"
                      >
                        <i className="fas fa-edit mr-1"></i> Update
                      </Button>
                    </UpdateGatewayModal>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="!rounded-button cursor-pointer whitespace-nowrap"
                      onClick={() => handleDelete(gateway.id)}
                    >
                      <i className="fas fa-trash-alt mr-1"></i> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <>
      {wallets && !isLoading && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-bold">
                {isSubAdminView
                  ? "My Payment Numbers"
                  : targetSubAdmin
                  ? `Banking Numbers: ${targetSubAdmin.name} (${targetSubAdmin.agentCode})`
                  : scope === "all"
                  ? "All Banking Gateways"
                  : "Banking Management (Default Site)"}
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {isSubAdminView
                  ? "Players registered under your agent link see your active payment numbers here."
                  : "Manage platform default deposit numbers or switch to inspect/set numbers for a specific Sub-Admin."}
              </p>
            </div>

            {!isSubAdminView && (
              <div className="flex flex-wrap items-center gap-2">
                {targetSubAdmin && (
                  <Link href="/sub-admins">
                    <Button variant="outline" size="sm">
                      Back to Sub-Admins
                    </Button>
                  </Link>
                )}
                <Select value={scope} onValueChange={handleScopeChange}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Filter Account Scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      Default Platform Numbers
                    </SelectItem>
                    <SelectItem value="all">
                      All Gateways (Platform + Agents)
                    </SelectItem>
                    {subAdmins.map((sa) => (
                      <SelectItem key={sa.id} value={sa.id}>
                        Agent: {sa.name} ({sa.agentCode || "No Code"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {!isSubAdminView && targetSubAdmin && (
            <Alert className="border-blue-500/30 bg-blue-500/10 text-blue-100">
              <AlertTitle>
                Managing Banking Numbers for Agent: {targetSubAdmin.name} (
                {targetSubAdmin.agentCode})
              </AlertTitle>
              <AlertDescription className="text-blue-200 text-xs">
                Any gateway created here is assigned exclusively to{" "}
                {targetSubAdmin.agentCode}. If no active numbers exist with at
                least one wallet number, their players fall back to Default
                Platform Numbers.
              </AlertDescription>
            </Alert>
          )}

          {isSubAdminView && !hasActiveSubAdminNumbers && (
            <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-100">
              <AlertTitle>
                Fallback Active — No Custom Payment Numbers Set
              </AlertTitle>
              <AlertDescription className="text-amber-200 text-xs">
                You have not set any active custom numbers yet. Right now, your
                players see Default Platform Numbers on Deposit. Click
                &ldquo;+ Create New Gateway&rdquo; below to set your own bKash /
                Nagad / Rocket numbers.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="e-wallet" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger
                value="e-wallet"
                className="!rounded-button cursor-pointer whitespace-nowrap"
              >
                E-Wallet
              </TabsTrigger>
              <TabsTrigger
                value="card-crypto"
                className="!rounded-button cursor-pointer whitespace-nowrap"
              >
                Card & Crypto
              </TabsTrigger>
              <TabsTrigger
                value="payment-methods"
                className="!rounded-button cursor-pointer whitespace-nowrap"
              >
                Payment Methods
              </TabsTrigger>
            </TabsList>
            <TabsContent value="e-wallet">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  E-Wallet Payment Gateways
                </h2>
                <CreateGatewayModal
                  subAdminId={scope}
                  templates={templates}
                >
                  <Button
                    variant={"primary"}
                    className="!rounded-button cursor-pointer whitespace-nowrap"
                  >
                    <i className="fas fa-plus mr-2"></i> Create New Gateway
                  </Button>
                </CreateGatewayModal>
              </div>
              {renderStatisticsBar(eWallets)}
              {eWallets.length > 0 ? (
                renderTable(eWallets)
              ) : (
                <div className="text-center py-8 border rounded-md text-sm text-gray-400">
                  No Wallets Found for this account scope. Click &ldquo;Create
                  New Gateway&rdquo; above to add one.
                </div>
              )}
            </TabsContent>
            <TabsContent value="card-crypto">
              <span className="text-sm text-gray-400 block text-center pt-8">
                No Payment Gateway Found
              </span>
            </TabsContent>
            <TabsContent value="payment-methods">
              <span className="text-sm text-gray-400 block text-center pt-8">
                No Payment Gateway Found
              </span>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {(!wallets || isLoading) && (
        <div className="flex w-full h-[85vh] justify-center items-center">
          <CookieLoader />
        </div>
      )}
    </>
  );
};

const Banking = () => {
  return (
    <Suspense
      fallback={
        <div className="flex w-full h-[85vh] justify-center items-center">
          <CookieLoader />
        </div>
      }
    >
      <BankingContent />
    </Suspense>
  );
};

export default Banking;
