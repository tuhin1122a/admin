import bcrypt from "bcryptjs";
const { PrismaClient, ManagementRole, PaymentWalletType, DepositStatus, WithdrawStatus, NotificationIcon } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Start database seeding...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Seed Bonus Settings
  console.log("Seeding Bonus settings...");
  const bonusCount = await prisma.bonus.count();
  if (bonusCount === 0) {
    await prisma.bonus.create({
      data: {
        signinBonus: 10,
        referralBonus: 15,
      },
    });
  } else {
    console.log("Bonus settings already seeded.");
  }

  // 2. Seed SiteSettings
  console.log("Seeding SiteSettings...");
  const siteSettingCount = await prisma.siteSetting.count();
  if (siteSettingCount === 0) {
    await prisma.siteSetting.create({
      data: {
        maxWithdraw: 50000,
        minWithdraw: 200,
        dpTurnover: 1.0,
        sliderImages: [
          "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=1200&auto=format&fit=crop&q=80"
        ],
        promotionsLogo: "https://images.unsplash.com/photo-1540747737956-37872404459a?w=400&auto=format&fit=crop&q=80"
      },
    });
  } else {
    console.log("SiteSettings already seeded.");
  }

  // 3. Seed SigninBonusRewards (7 Days logic)
  console.log("Seeding SigninBonusRewards...");
  const signinRewardsCount = await prisma.signinBonusRewards.count();
  if (signinRewardsCount === 0) {
    const signinRewards = [
      { day: "1", prize: 5, deposit: 200 },
      { day: "2", prize: 10, deposit: 200 },
      { day: "3", prize: 15, deposit: 500 },
      { day: "4", prize: 20, deposit: 500 },
      { day: "5", prize: 25, deposit: 1000 },
      { day: "6", prize: 30, deposit: 1000 },
      { day: "7", prize: 50, deposit: 2000 },
    ];
    for (const reward of signinRewards) {
      await prisma.signinBonusRewards.create({
        data: reward,
      });
    }
  } else {
    console.log("SigninBonusRewards already seeded.");
  }

  // 4. Seed InvitationRewards
  console.log("Seeding InvitationRewards...");
  const inviteRewardsCount = await prisma.invitationRewards.count();
  if (inviteRewardsCount === 0) {
    const inviteRewards = [
      { rewardImg: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100", targetReferral: 3, prize: 50 },
      { rewardImg: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=100", targetReferral: 10, prize: 200 },
      { rewardImg: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100", targetReferral: 30, prize: 1000 },
    ];
    for (const reward of inviteRewards) {
      await prisma.invitationRewards.create({
        data: reward,
      });
    }
  } else {
    console.log("InvitationRewards already seeded.");
  }

  // 5. Seed Admin Users
  console.log("Seeding Admins...");
  const adminExists = await prisma.admin.findUnique({
    where: { email: "admin@example.com" }
  });
  let adminId = "";
  if (!adminExists) {
    const admin = await prisma.admin.create({
      data: {
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: ManagementRole.ADMIN,
      },
    });
    adminId = admin.id;
  } else {
    console.log("Admin user already exists.");
    adminId = adminExists.id;
  }

  const subAdminExists = await prisma.admin.findUnique({
    where: { email: "subadmin@example.com" }
  });
  if (!subAdminExists) {
    await prisma.admin.create({
      data: {
        name: "Sub-Admin User",
        email: "subadmin@example.com",
        password: hashedPassword,
        role: ManagementRole.SUBADMIN,
      },
    });
  }

  // 6. Seed Payment & Deposit Wallets
  console.log("Seeding Payment Wallets...");
  const wallets = [
    {
      walletName: "bKash",
      walletLogo: "https://res.cloudinary.com/dxs9u7pqc/image/upload/v1746607129/mbuzz88/kdi4ajsyggxdjl8xvyy5.png",
      walletType: PaymentWalletType.EWALLET,
      walletsNumber: ["01712345678", "01787654321"],
      instructions: "Send Money to our agent or personal bKash number, copy the transaction ID, and submit it below.",
      warning: "Do not save this number. Check the active numbers every time before depositing.",
      trxType: "Send Money",
      minDeposit: 200,
      maximumDeposit: 20000,
    },
    {
      walletName: "Nagad",
      walletLogo: "https://res.cloudinary.com/dxs9u7pqc/image/upload/v1746607134/mbuzz88/ittgozvoezof3cqbprik.png",
      walletType: PaymentWalletType.EWALLET,
      walletsNumber: ["01812345678"],
      instructions: "Send Money to Nagad, copy TxID, and submit here.",
      warning: "Always double-check active numbers.",
      trxType: "Send Money",
      minDeposit: 100,
      maximumDeposit: 25000,
    },
    {
      walletName: "Upay",
      walletLogo: "https://res.cloudinary.com/dxs9u7pqc/image/upload/v1746607130/mbuzz88/dx7stvyko3gvwvrwgxwx.png",
      walletType: PaymentWalletType.EWALLET,
      walletsNumber: ["01700000000"],
      instructions: "Send money to our Upay account",
      warning: "Always check active numbers.",
      trxType: "mobile",
      minDeposit: 100,
      maximumDeposit: 50000,
    },
    {
      walletName: "Rocket",
      walletLogo: "https://res.cloudinary.com/dxs9u7pqc/image/upload/v1746607131/mbuzz88/mqo9muoc3pevb6kff8jb.png",
      walletType: PaymentWalletType.EWALLET,
      walletsNumber: ["01700000000"],
      instructions: "Send money to our Rocket account",
      warning: "Always check active numbers.",
      trxType: "mobile",
      minDeposit: 100,
      maximumDeposit: 50000,
    },
    {
      walletName: "DurantoPay",
      walletLogo: "https://res.cloudinary.com/dxs9u7pqc/image/upload/v1746607130/mbuzz88/xrqqj8zdn7dtdwcsn4wd.png",
      walletType: PaymentWalletType.EWALLET,
      walletsNumber: ["01700000000"],
      instructions: "Send money via DurantoPay",
      warning: "Always check active numbers.",
      trxType: "mobile",
      minDeposit: 100,
      maximumDeposit: 50000,
    },
  ];

  let bkashWalletId = "";
  let nagadWalletId = "";
  let bkashDepositWalletId = "";
  let nagadDepositWalletId = "";

  for (const w of wallets) {
    let paymentWallet = await prisma.paymentWallet.findFirst({
      where: { walletName: w.walletName }
    });
    
    if (!paymentWallet) {
      paymentWallet = await prisma.paymentWallet.create({
        data: {
          walletName: w.walletName,
          walletLogo: w.walletLogo,
          walletType: w.walletType,
        },
      });
    }

    if (w.walletName === "bKash") bkashWalletId = paymentWallet.id;
    if (w.walletName === "Nagad") nagadWalletId = paymentWallet.id;

    let depositWallet = await prisma.depositWallet.findFirst({
      where: { paymentWalletId: paymentWallet.id }
    });

    if (!depositWallet) {
      depositWallet = await prisma.depositWallet.create({
        data: {
          paymentWalletId: paymentWallet.id,
          walletsNumber: w.walletsNumber,
          instructions: w.instructions,
          warning: w.warning,
          trxType: w.trxType,
          minDeposit: w.minDeposit,
          maximumDeposit: w.maximumDeposit,
          isActive: true,
        },
      });
    }

    if (w.walletName === "bKash") bkashDepositWalletId = depositWallet.id;
    if (w.walletName === "Nagad") nagadDepositWalletId = depositWallet.id;
  }

  // 7. Seed Sample Users & Players
  console.log("Seeding Users & Players...");

  // --- Abir Hossain ---
  const abirPhone = "01911111111";
  let user1 = await prisma.user.findUnique({ where: { phone: abirPhone }, include: { cardContainer: { include: { cards: true } } } });
  if (!user1) {
    const player1 = await prisma.player.create({
      data: {
        playerId: "100001",
        name: "Abir Hossain",
        email: `${abirPhone}@tk1111.com`,
      }
    });

    user1 = await prisma.user.create({
      data: {
        name: "Abir Hossain",
        phone: abirPhone,
        password: hashedPassword,
        playerId: player1.playerId,
        gameXAPlayerId: player1.playerId,
        referId: "REFABIR",
        isBanned: false,
        wallet: {
          create: {
            balance: 5500.50,
            signinBonus: true,
            referralBonus: false,
            currency: "BDT",
            turnOver: 250.00,
            playerId: player1.id,
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
                  cardNumber: abirPhone,
                  walletNumber: abirPhone,
                  paymentWalletid: bkashWalletId,
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
    console.log("Seeded user Abir Hossain");
  }

  // --- Tariqul Islam ---
  const tariqPhone = "01922222222";
  let user2 = await prisma.user.findUnique({ where: { phone: tariqPhone } });
  if (!user2) {
    const player2 = await prisma.player.create({
      data: {
        playerId: "100002",
        name: "Tariqul Islam",
        email: `${tariqPhone}@tk1111.com`,
      }
    });

    user2 = await prisma.user.create({
      data: {
        name: "Tariqul Islam",
        phone: tariqPhone,
        password: hashedPassword,
        playerId: player2.playerId,
        gameXAPlayerId: player2.playerId,
        referId: "REFTARIQ",
        isBanned: false,
        invitedById: "INV-ABIR-101",
        wallet: {
          create: {
            balance: 750.00,
            signinBonus: false,
            referralBonus: true,
            currency: "BDT",
            turnOver: 0.00,
            playerId: player2.id,
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
                  cardNumber: tariqPhone,
                  walletNumber: tariqPhone,
                  paymentWalletid: nagadWalletId,
                  isActive: true
                }
              ]
            }
          }
        }
      }
    });
    console.log("Seeded user Tariqul Islam");
  }

  // --- Sajjad Rahman ---
  const sajjadPhone = "01933333333";
  let user3 = await prisma.user.findUnique({ where: { phone: sajjadPhone } });
  if (!user3) {
    const player3 = await prisma.player.create({
      data: {
        playerId: "100003",
        name: "Sajjad Rahman",
        email: `${sajjadPhone}@tk1111.com`,
      }
    });

    user3 = await prisma.user.create({
      data: {
        name: "Sajjad Rahman",
        phone: sajjadPhone,
        password: hashedPassword,
        playerId: player3.playerId,
        gameXAPlayerId: player3.playerId,
        referId: "REFSAJJAD",
        isBanned: true,
        wallet: {
          create: {
            balance: 15.00,
            signinBonus: false,
            referralBonus: false,
            currency: "BDT",
            turnOver: 0.00,
            playerId: player3.id,
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
    console.log("Seeded user Sajjad Rahman");
  }

  // --- Demo Player ---
  const demoPhone = "01712345678";
  let demoUser = await prisma.user.findUnique({ where: { phone: demoPhone } });
  if (!demoUser) {
    const referId = "DEMO_REF_" + Math.floor(1000 + Math.random() * 9000);
    const mockGameXAPlayerId = "MOCK_GX_" + Math.floor(100000 + Math.random() * 900000);

    const demoPlayer = await prisma.player.create({
      data: {
        playerId: mockGameXAPlayerId,
        name: "Demo Player",
        email: `${demoPhone}@tk1111.com`,
      },
    });

    demoUser = await prisma.user.create({
      data: {
        phone: demoPhone,
        email: `${demoPhone}@tk1111.com`,
        password: hashedPassword,
        playerId: demoPlayer.playerId,
        gameXAPlayerId: demoPlayer.playerId,
        referId,
        isBanned: false,
        bettingRecord: { create: {} },
        wallet: {
          create: {
            balance: 5000,
            signinBonus: true,
            referralBonus: false,
            currency: "BDT",
            playerId: demoPlayer.id,
          },
        },
        inviationBonus: { create: {} },
      },
    });
    console.log("Seeded Demo Player");
  }

  // 8. Seed Sample Deposits & Withdrawals & Notifications & Chats
  console.log("Seeding Sample Transactions & Notifications...");
  
  const depositExists = await prisma.deposit.findFirst({ where: { userId: user1.id } });
  if (!depositExists && bkashDepositWalletId && nagadDepositWalletId) {
    await prisma.deposit.create({
      data: {
        amount: 1000.00,
        bonus: 10.00,
        bonusFor: "First Deposit Bonus",
        senderNumber: abirPhone,
        trxID: "TRXBKASH99881",
        walletId: bkashDepositWalletId,
        walletNumber: "01712345678",
        trackingNumber: "DEP-TRACK-10001",
        expire: new Date(Date.now() + 60 * 60 * 1000),
        status: DepositStatus.APPROVED,
        userId: user1.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    });

    await prisma.deposit.create({
      data: {
        amount: 500.00,
        bonus: 0.00,
        bonusFor: "",
        senderNumber: tariqPhone,
        trxID: "TRXNAGAD77881",
        walletId: nagadDepositWalletId,
        walletNumber: "01812345678",
        trackingNumber: "DEP-TRACK-10002",
        expire: new Date(Date.now() + 60 * 60 * 1000),
        status: DepositStatus.PENDING,
        userId: user2.id,
        createdAt: new Date()
      }
    });
  }

  const withdrawExists = await prisma.withdraw.findFirst({ where: { userId: user1.id } });
  if (!withdrawExists && user1.cardContainer && user1.cardContainer.cards.length > 0) {
    const abirCard = user1.cardContainer.cards[0];
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

  const notificationExists = await prisma.notification.findFirst({ where: { userId: user1.id } });
  if (!notificationExists) {
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
  }

  const chatExists = await prisma.chatMessage.findFirst({ where: { senderId: user1.id } });
  if (!chatExists && adminId) {
    await prisma.chatMessage.create({
      data: {
        senderId: user1.id,
        receiverId: adminId,
        content: "Hello Support! My withdrawal is taking a bit long, could you check it please?"
      }
    });

    await prisma.chatMessage.create({
      data: {
        senderId: adminId,
        receiverId: user1.id,
        content: "Sure Abir! Let me look into that. It should be approved within 15 minutes."
      }
    });
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e: Error) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });