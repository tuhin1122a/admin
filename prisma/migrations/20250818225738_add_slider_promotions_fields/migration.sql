-- CreateEnum
CREATE TYPE "app"."PaymentWalletType" AS ENUM ('EWALLET', 'BANK', 'CARD', 'CRYPTO');

-- CreateEnum
CREATE TYPE "app"."DepositStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "app"."WithdrawStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "app"."ManagementRole" AS ENUM ('ADMIN', 'SUBADMIN');

-- CreateEnum
CREATE TYPE "app"."NotificationIcon" AS ENUM ('MONEY', 'BELL', 'TROPHY', 'WARNING', 'INFO', 'DEPOSIT', 'WITHDRAW', 'BONUS');

-- CreateTable
CREATE TABLE "app"."User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Pro User',
    "password" TEXT NOT NULL,
    "withdrawPassword" TEXT,
    "playerId" TEXT NOT NULL,
    "facebook" TEXT DEFAULT '',
    "isBanned" BOOLEAN NOT NULL,
    "referId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedById" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."BettingRecord" (
    "id" TEXT NOT NULL,
    "totalBet" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalWin" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BettingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Invitation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."InvitationBonus" (
    "id" TEXT NOT NULL,
    "totalRegisters" INTEGER NOT NULL DEFAULT 0,
    "totalValidreferral" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InvitationBonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."InvitationRewareds" (
    "id" TEXT NOT NULL,
    "rewardImg" TEXT NOT NULL,
    "targetReferral" INTEGER NOT NULL,
    "prize" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "InvitationRewareds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."SigninBonusRewards" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "prize" INTEGER NOT NULL,
    "deposit" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "SigninBonusRewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."ClaimedSigninReward" (
    "id" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "depositId" TEXT NOT NULL,
    "isClamed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ClaimedSigninReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."ClaimedInvitationReward" (
    "id" TEXT NOT NULL,
    "invitationBonusId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimedInvitationReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Wallet" (
    "id" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "signinBonus" BOOLEAN NOT NULL DEFAULT false,
    "referralBonus" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "turnOver" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Bonus" (
    "id" TEXT NOT NULL,
    "signinBonus" INTEGER NOT NULL DEFAULT 5,
    "referralBonus" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "Bonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."PaymentWallet" (
    "id" TEXT NOT NULL,
    "walletLogo" TEXT NOT NULL,
    "walletName" TEXT NOT NULL,
    "walletType" "app"."PaymentWalletType" NOT NULL DEFAULT 'EWALLET',

    CONSTRAINT "PaymentWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."DepositWallet" (
    "id" TEXT NOT NULL,
    "paymentWalletId" TEXT NOT NULL,
    "walletsNumber" TEXT[],
    "instructions" TEXT NOT NULL,
    "warning" TEXT,
    "trxType" TEXT NOT NULL,
    "minDeposit" DECIMAL(65,30) NOT NULL,
    "maximumDeposit" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DepositWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."APayDeposit" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "trxId" TEXT NOT NULL,
    "ps" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "APayDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."APayWithdraw" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ps" TEXT NOT NULL,
    "trxId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "APayWithdraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Deposit" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "bonus" DECIMAL(65,30),
    "bonusFor" TEXT NOT NULL,
    "senderNumber" TEXT NOT NULL,
    "trxID" TEXT,
    "walletId" TEXT NOT NULL,
    "walletNumber" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "expire" TIMESTAMP(3) NOT NULL,
    "status" "app"."DepositStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."CardContainer" (
    "id" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Card" (
    "id" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "walletNumber" TEXT NOT NULL,
    "paymentWalletid" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Withdraw" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "expire" TIMESTAMP(3) NOT NULL,
    "status" "app"."WithdrawStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Withdraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "app"."ManagementRole" NOT NULL DEFAULT 'ADMIN',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "expire" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."SiteSetting" (
    "id" TEXT NOT NULL,
    "maxWithdraw" DECIMAL(65,30) DEFAULT 0,
    "minWithdraw" DECIMAL(65,30) DEFAULT 0,
    "dpTurnover" DECIMAL(65,30) DEFAULT 0,
    "sliderImages" TEXT[],
    "promotionsLogo" TEXT,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" "app"."NotificationIcon" NOT NULL DEFAULT 'INFO',
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."ChatMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "app"."User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_playerId_key" ON "app"."User"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_referId_key" ON "app"."User"("referId");

-- CreateIndex
CREATE UNIQUE INDEX "BettingRecord_userId_key" ON "app"."BettingRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_userId_key" ON "app"."Invitation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InvitationBonus_userId_key" ON "app"."InvitationBonus"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimedSigninReward_userId_key" ON "app"."ClaimedSigninReward"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimedSigninReward_depositId_key" ON "app"."ClaimedSigninReward"("depositId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimedInvitationReward_invitationBonusId_rewardId_key" ON "app"."ClaimedInvitationReward"("invitationBonusId", "rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "app"."Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_trackingNumber_key" ON "app"."Deposit"("trackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CardContainer_userId_key" ON "app"."CardContainer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "app"."Admin"("email");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "app"."Notification"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "app"."ChatMessage"("senderId");

-- CreateIndex
CREATE INDEX "ChatMessage_receiverId_idx" ON "app"."ChatMessage"("receiverId");

-- AddForeignKey
ALTER TABLE "app"."User" ADD CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "app"."Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."BettingRecord" ADD CONSTRAINT "BettingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Invitation" ADD CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."InvitationBonus" ADD CONSTRAINT "InvitationBonus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ClaimedSigninReward" ADD CONSTRAINT "ClaimedSigninReward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "app"."SigninBonusRewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ClaimedSigninReward" ADD CONSTRAINT "ClaimedSigninReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ClaimedSigninReward" ADD CONSTRAINT "ClaimedSigninReward_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "app"."Deposit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ClaimedInvitationReward" ADD CONSTRAINT "ClaimedInvitationReward_invitationBonusId_fkey" FOREIGN KEY ("invitationBonusId") REFERENCES "app"."InvitationBonus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ClaimedInvitationReward" ADD CONSTRAINT "ClaimedInvitationReward_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "app"."InvitationRewareds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."APayDeposit" ADD CONSTRAINT "APayDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."APayWithdraw" ADD CONSTRAINT "APayWithdraw_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Deposit" ADD CONSTRAINT "Deposit_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "app"."DepositWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Deposit" ADD CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."CardContainer" ADD CONSTRAINT "CardContainer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Card" ADD CONSTRAINT "Card_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "app"."CardContainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Withdraw" ADD CONSTRAINT "Withdraw_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "app"."Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Withdraw" ADD CONSTRAINT "Withdraw_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
