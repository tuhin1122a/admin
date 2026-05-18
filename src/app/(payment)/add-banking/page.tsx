"use client";
import Image from "next/image";
// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React from "react";
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
const Banking = () => {
  const { data: wallets, isLoading } = useFetchWalletsQuery();
  console.log("wallets", wallets);
  function getWalletByType(
    walletType: PaymentWalletType
  ): ExtenedDepositWallet[] {
    if (!wallets) return [];
    return wallets!.data.wallets.filter(
      (wallet) => wallet.paymentWallet.walletType === walletType
    );
  }

  const eWallets = getWalletByType("EWALLET");

  const [deleteWalletApi] = useDeleteWalletMutation();

  const handleDelete = (id: string) => {
    const confirmation = window.confirm("are you sure to delete?");
    if (!confirmation) return 1;
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

  const getActiveCount = (data: any[]) => {
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
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Left Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((gateway) => (
              <TableRow key={gateway.id}>
                <TableCell>
                  <Image
                    src={gateway.paymentWallet.walletLogo}
                    alt={gateway.paymentWallet.walletName}
                    width={40}
                    height={40}
                    className="object-contain rounded-md"
                  />
                </TableCell>
                <TableCell className="font-medium capitalize">
                  {gateway.paymentWallet.walletName}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span
                      className={`${
                        gateway.isActive ? "text-emerald-700" : "text-red-500"
                      } text-sm`}
                    >
                      {" "}
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
                      gateway.trxType &&
                      "Ready to manage Deposits "
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
                        image: gateway.paymentWallet.walletLogo,
                        name: gateway.paymentWallet.walletName,
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
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Banking Management</h1>
            <div className="text-sm text-gray-500"></div>
          </div>
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
              {eWallets && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">
                      E-Wallet Payment Gateways
                    </h2>
                    <CreateGatewayModal>
                      <Button
                        variant={"primary"}
                        className="!rounded-button cursor-pointer whitespace-nowrap"
                      >
                        <i className="fas fa-plus mr-2"></i> Create New Gateway
                      </Button>
                    </CreateGatewayModal>
                  </div>
                  {renderStatisticsBar(eWallets)}
                  {renderTable(eWallets)}
                </>
              )}

              {(!eWallets || eWallets.length < 0) && (
                <div className="text-center py-5">No Wallets Found</div>
              )}
            </TabsContent>
            <TabsContent value="card-crypto">
              <span className="text-sm text-white block text-center pt-8">
                No Payment Gateway Found
              </span>
              {/* {cryptoWallets && cryptoWallets.length > 0 && (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">
                        Card & Crypto Payment Gateways
                      </h2>
                      <Button
                        onClick={handleCreateClick}
                        variant={"primary"}
                        className="!rounded-button cursor-pointer whitespace-nowrap"
                      >
                        <i className="fas fa-plus mr-2"></i> Create New Gateway
                      </Button>
                    </div>
                    {renderStatisticsBar(cardCryptoData)}
                    {renderTable(cardWallets)}
                  </>
                )}
                {(!cryptoWallets || cryptoWallets.length < 0) && (
                  <div className="text-center py-5">No Wallets Found</div>
                )} */}
            </TabsContent>
            <TabsContent value="payment-methods">
              <span className="text-sm text-white block text-center pt-8">
                No Payment Gateway Found
              </span>
              {/* {cardCryptoData && cardCryptoData.length > 0 && (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">
                        Other Payment Methods
                      </h2>
                      <Button
                        variant={"primary"}
                        onClick={handleCreateClick}
                        className="!rounded-button cursor-pointer whitespace-nowrap"
                      >
                        <i className="fas fa-plus mr-2"></i> Create New Gateway
                      </Button>
                    </div>
                    {renderStatisticsBar(paymentMethodsData)}
                    {renderTable(paymentMethodsData)}
                  </>
                )}

                {(!cardCryptoData || cardCryptoData.length < 0) && (
                  <div className="text-center py-5">No Wallets Found</div>
                )} */}
            </TabsContent>
          </Tabs>
          {/* {renderUpdateModal()}
            {renderCreateModal()} */}
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
export default Banking;
