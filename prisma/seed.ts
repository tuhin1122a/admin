import bcrypt from "bcryptjs";
const { PrismaClient, ManagementRole, PaymentWalletType, DepositStatus, WithdrawStatus, NotificationIcon } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Cleaning up existing database records in proper order (reverse of dependency)
  console.log("🧹 Cleaning up database...");
  await prisma.claimedSigninReward.deleteMany();
  await prisma.claimedInvitationReward.deleteMany();
  await prisma.bettingRecord.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.withdraw.deleteMany();
  await prisma.card.deleteMany();
  await prisma.cardContainer.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.invitationBonus.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.depositWallet.deleteMany();
  await prisma.paymentWallet.deleteMany();
  await prisma.signinBonusRewards.deleteMany();
  await prisma.invitationRewareds.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.bonus.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  console.log("✨ Database cleaned!");

  // 2. Seed Admins
  console.log("👥 Seeding Admins...");
  const admin = await prisma.admin.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: ManagementRole.ADMIN,
    },
  });

  const subAdmin = await prisma.admin.create({
    data: {
      name: "Sub-Admin User",
      email: "subadmin@example.com",
      password: hashedPassword,
      role: ManagementRole.SUBADMIN,
    },
  });

  // 3. Seed Site Settings
  console.log("⚙️ Seeding Site Settings...");
  const siteSettings = await prisma.siteSetting.create({
    data: {
      minWithdraw: 500,
      maxWithdraw: 25000,
      dpTurnover: 1.0,
      sliderImages: [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=1200&auto=format&fit=crop&q=80"
      ],
      promotionsLogo: "https://images.unsplash.com/photo-1540747737956-37872404459a?w=400&auto=format&fit=crop&q=80"
    }
  });

  // 4. Seed Bonuses configuration
  console.log("🎁 Seeding Bonus Configs...");
  const bonusConfig = await prisma.bonus.create({
    data: {
      signinBonus: 10,
      referralBonus: 15,
    }
  });

  // 5. Seed Payment Wallets (bKash, Nagad, Bank, etc.)
  console.log("💳 Seeding Payment Wallets...");
  const bkashWallet = await prisma.paymentWallet.create({
    data: {
      walletName: "bKash",
      walletLogo: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80",
      walletType: PaymentWalletType.EWALLET,
    }
  });

  const nagadWallet = await prisma.paymentWallet.create({
    data: {
      walletName: "Nagad",
      walletLogo: "https://images.unsplash.com/photo-1616077168079-7e09a677fb2c?w=150&auto=format&fit=crop&q=80",
      walletType: PaymentWalletType.EWALLET,
    }
  });

  // 6. Seed Deposit Wallets
  console.log("📥 Seeding Deposit Wallets...");
  const bkashDepositWallet = await prisma.depositWallet.create({
    data: {
      paymentWalletId: bkashWallet.id,
      walletsNumber: ["01712345678", "01787654321"],
      instructions: "Send Money to our agent or personal bKash number, copy the transaction ID, and submit it below.",
      warning: "Do not save this number. Check the active numbers every time before depositing.",
      trxType: "Send Money",
      minDeposit: 200,
      maximumDeposit: 20000,
      isActive: true
    }
  });

  const nagadDepositWallet = await prisma.depositWallet.create({
    data: {
      paymentWalletId: nagadWallet.id,
      walletsNumber: ["01812345678"],
      instructions: "Send Money to Nagad, copy TxID, and submit here.",
      warning: "Always double-check active numbers.",
      trxType: "Send Money",
      minDeposit: 100,
      maximumDeposit: 25000,
      isActive: true
    }
  });

  // 7. Seed Signin Bonus Rewards (7 Days logic)
  console.log("📅 Seeding Daily Sign-in Milestone Rewards...");
  const signinRewards = [
    { day: "1", prize: 5, deposit: 0 },
    { day: "2", prize: 10, deposit: 0 },
    { day: "3", prize: 15, deposit: 100 },
    { day: "4", prize: 20, deposit: 100 },
    { day: "5", prize: 35, deposit: 200 },
    { day: "6", prize: 50, deposit: 200 },
    { day: "7", prize: 120, deposit: 500 },
  ];
  for (const reward of signinRewards) {
    await prisma.signinBonusRewards.create({
      data: reward
    });
  }

  // 8. Seed Invitation Milestone Rewards
  console.log("🤝 Seeding Invitation Milestone Rewards...");
  const inviteRewards = [
    { rewardImg: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100", targetReferral: 3, prize: 50 },
    { rewardImg: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100", targetReferral: 5, prize: 100 },
    { rewardImg: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100", targetReferral: 10, prize: 250 },
  ];
  for (const reward of inviteRewards) {
    await prisma.invitationRewareds.create({
      data: reward
    });
  }

  // 9. Seed Sample Users with all linked components
  console.log("👤 Seeding Sample Users, Wallets, and Betting Records...");
  const user1 = await prisma.user.create({
    data: {
      name: "Abir Hossain",
      phone: "01911111111",
      password: hashedPassword,
      playerId: "100001",
      referId: "REFABIR",
      isBanned: false,
      wallet: {
        create: {
          balance: 5500.50,
          signinBonus: true,
          referralBonus: false,
          currency: "BDT",
          turnOver: 250.00
        }
      },
      bettingRecord: {
        create: {
          totalBet: 1200.00,
          totalWin: 950.00
        }
      },
      inviationBonus: {
        create: {
          totalRegisters: 4,
          totalValidreferral: 3
        }
      },
      cardContainer: {
        create: {
          ownerName: "Abir Hossain",
          password: "withdrawalpass123",
          cards: {
            create: [
              {
                cardNumber: "01911111111",
                walletNumber: "01911111111",
                paymentWalletid: bkashWallet.id,
                isActive: true
              }
            ]
          }
        }
      },
      Invitation: {
        create: {
          id: "INV-ABIR-101"
        }
      }
    },
    include: {
      cardContainer: {
        include: {
          cards: true
        }
      }
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Tariqul Islam",
      phone: "01922222222",
      password: hashedPassword,
      playerId: "100002",
      referId: "REFTARIQ",
      isBanned: false,
      invitedById: "INV-ABIR-101", // User 2 is referred by User 1's Invitation
      wallet: {
        create: {
          balance: 750.00,
          signinBonus: false,
          referralBonus: true,
          currency: "BDT",
          turnOver: 0.00
        }
      },
      bettingRecord: {
        create: {
          totalBet: 50.00,
          totalWin: 0.00
        }
      },
      inviationBonus: {
        create: {
          totalRegisters: 0,
          totalValidreferral: 0
        }
      },
      cardContainer: {
        create: {
          ownerName: "Tariqul Islam",
          password: "withpassword9",
          cards: {
            create: [
              {
                cardNumber: "01922222222",
                walletNumber: "01922222222",
                paymentWalletid: nagadWallet.id,
                isActive: true
              }
            ]
          }
        }
      }
    }
  });

  const user3 = await prisma.user.create({
    data: {
      name: "Sajjad Rahman",
      phone: "01933333333",
      password: hashedPassword,
      playerId: "100003",
      referId: "REFSAJJAD",
      isBanned: true, // Sample Banned User
      wallet: {
        create: {
          balance: 15.00,
          signinBonus: false,
          referralBonus: false,
          currency: "BDT",
          turnOver: 0.00
        }
      },
      bettingRecord: {
        create: {
          totalBet: 0.00,
          totalWin: 0.00
        }
      },
      inviationBonus: {
        create: {
          totalRegisters: 0,
          totalValidreferral: 0
        }
      }
    }
  });

  // 10. Seed Sample Deposits
  console.log("💰 Seeding Sample Deposits...");
  await prisma.deposit.create({
    data: {
      amount: 1000.00,
      bonus: 10.00,
      bonusFor: "First Deposit Bonus",
      senderNumber: "01911111111",
      trxID: "TRXBKASH99881",
      walletId: bkashDepositWallet.id,
      walletNumber: "01712345678",
      trackingNumber: "DEP-TRACK-10001",
      expire: new Date(Date.now() + 60 * 60 * 1000), // Expirable in 1 Hour
      status: DepositStatus.APPROVED,
      userId: user1.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 Days ago
    }
  });

  await prisma.deposit.create({
    data: {
      amount: 500.00,
      bonus: 0.00,
      bonusFor: "",
      senderNumber: "01922222222",
      trxID: "TRXNAGAD77881",
      walletId: nagadDepositWallet.id,
      walletNumber: "01812345678",
      trackingNumber: "DEP-TRACK-10002",
      expire: new Date(Date.now() + 60 * 60 * 1000),
      status: DepositStatus.PENDING,
      userId: user2.id,
      createdAt: new Date()
    }
  });

  // 11. Seed Sample Withdraws
  console.log("💸 Seeding Sample Withdrawals...");
  const abirCard = user1.cardContainer?.cards[0];
  if (abirCard) {
    await prisma.withdraw.create({
      data: {
        amount: 800.00,
        expire: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: WithdrawStatus.PENDING,
        cardId: abirCard.id,
        userId: user1.id,
        createdAt: new Date()
      }
    });
  }

  // 12. Seed Notifications
  console.log("🔔 Seeding Notifications...");
  await prisma.notification.create({
    data: {
      title: "Welcome Bonus Claimed!",
      description: "Congratulations! You have successfully claimed your day 1 signin reward of 5 BDT.",
      icon: NotificationIcon.BONUS,
      userId: user1.id,
      isRead: false
    }
  });

  await prisma.notification.create({
    data: {
      title: "Deposit Successful",
      description: "Your deposit of 1000 BDT has been approved successfully.",
      icon: NotificationIcon.DEPOSIT,
      userId: user1.id,
      isRead: true
    }
  });

  await prisma.notification.create({
    data: {
      title: "New Referral registered",
      description: "Tariqul Islam registered using your referral code.",
      icon: NotificationIcon.INFO,
      userId: user1.id,
      isRead: false
    }
  });

  // 13. Seed Chat Messages
  console.log("💬 Seeding Chat Messages...");
  await prisma.chatMessage.create({
    data: {
      senderId: user1.id,
      receiverId: admin.id,
      content: "Hello Support! My withdrawal is taking a bit long, could you check it please?"
    }
  });

  await prisma.chatMessage.create({
    data: {
      senderId: admin.id,
      receiverId: user1.id,
      content: "Sure Abir! Let me look into that. It should be approved within 15 minutes."
    }
  });

  console.log("✅ Database Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });