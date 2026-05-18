import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AddBalanceForm } from "./AddBalanceForm";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default async function AddBalancePage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  const resolvedSearchParams = await searchParams;
  const defaultPlayerId = resolvedSearchParams.playerId as string | undefined;

  // Fetch default user if playerId is provided
  const defaultUser = defaultPlayerId
    ? await db.user.findUnique({
        where: { playerId: defaultPlayerId },
        include: { wallet: true },
      })
    : null;

  if (defaultPlayerId && !defaultUser) {
    redirect("/admin/add-balance");
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Balance to User Wallet</CardTitle>
          <CardDescription>
            Add funds to user wallets and send them notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddBalanceForm defaultUser={defaultUser} />
        </CardContent>
      </Card>
    </div>
  );
}
