import { PaymentWalletType } from "@prisma/client";
import zod from "zod";

export const paymentWalletCreateSchema = zod
  .object({
    paymentWalletId: zod.optional(zod.string()),
    walletLogo: zod.string(),
    walletName: zod.string().min(1, "Wallet name is required"),
    wallets: zod.array(zod.string()).min(1, "Minimum 1 wallet required"),
    isActive: zod.boolean(),
    trxType: zod.optional(zod.string()),
    minDeposit: zod.optional(zod.string()),
    maxDeposit: zod.optional(zod.string()),
    instructions: zod.optional(zod.string()),
    warning: zod.optional(zod.string()),
    walletType: zod.enum([
      PaymentWalletType.BANK,
      PaymentWalletType.CARD,
      PaymentWalletType.CRYPTO,
      PaymentWalletType.EWALLET,
    ]),
  })
  .refine(
    (data) => Boolean(data.paymentWalletId) || data.walletLogo.trim().length > 0,
    {
      message: "Wallet Logo is required for custom gateways",
      path: ["walletLogo"],
    }
  );

export const paymentWalletUpdateSchema = zod.object({
  wallets: zod.array(zod.string()).min(1, "Minimum 1 wallet required"),
  isActive: zod.optional(zod.boolean()),
  trxType: zod.string().min(1, "Trx Type is required"),
  minDeposit: zod.string().min(1, "Minimum Deposit is required"),
  maxDeposit: zod.string().min(1, "Maximum Deposit is required"),
  instructions: zod.optional(zod.string()),
  warning: zod.optional(zod.string()),
});

export const signinSchema = zod.object({
  email: zod
    .string()
    .min(1, "Email, Agent Code or Phone is required"),
  password: zod.string().min(1, "Password is required"),
});

export type SigninSchema = zod.infer<typeof signinSchema>;

export const nameChangeSchema = zod.object({
  name: zod.string().min(1, "Name is required"),
});
export type NameChangeSchema = zod.infer<typeof nameChangeSchema>;

export const passwordChangeSchema = zod.object({
  currentPassword: zod.string().min(1, "Current password is required"),
  newPassword: zod.string().min(6, "Password should be at least 6 char"),
});
export type PasswordChangeSchema = zod.infer<typeof passwordChangeSchema>;
export const emailChangeSchema = zod.object({
  token: zod.string().min(1, "Token is required"),
  newEmail: zod
    .string()
    .min(1, "Email is required")
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Enter a valid Email"
    ),
});
export type EmailChangeSchema = zod.infer<typeof emailChangeSchema>;

export const addBalanceSchema = zod.object({
  userIds: zod.array(zod.string()).min(1, "At least one user must be selected"),
  amount: zod.string().min(1, "Amount is required"),
  message: zod.string().optional(),
});
