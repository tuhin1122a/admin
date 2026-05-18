"use server";

import { db } from "@/lib/db";
import { addBalanceSchema } from "@/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function searchUsers(searchTerm: string) {
  if (!searchTerm.trim()) return [];

  return await db.user.findMany({
    where: {
      OR: [
        { phone: { contains: searchTerm } },
        { playerId: { contains: searchTerm } },
      ],
    },
    take: 10,
  });
}

export async function addBalanceToUsers(
  data: z.infer<typeof addBalanceSchema>
) {
  const { userIds, amount, message } = data;
  const amountDecimal = parseFloat(amount);

  if (userIds.length === 0) {
    throw new Error("At least one user must be selected");
  }

  if (amountDecimal <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  // Start a transaction
  const result = await db.$transaction(async (tx) => {
    // Update all wallets
    await tx.wallet.updateMany({
      where: { userId: { in: userIds } },
      data: { balance: { increment: amountDecimal } },
    });

    // Create notifications
    const notifications = userIds.map((userId) => ({
      title: "Balance Added",
      description: message || `${amount} BDT has been added to your wallet`,
      userId,
      metadata: {
        amount: amountDecimal,
        type: "balance_added",
      },
    }));

    await tx.notification.createMany({
      data: notifications,
    });

    return { count: userIds.length, amount: amountDecimal };
  });

  revalidatePath("/api/add-balance");
  return result;
}
