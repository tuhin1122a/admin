"use client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import { HiMiniUsers } from "react-icons/hi2";
import { MdDashboard, MdOutlinePayment } from "react-icons/md";

import { BiWorld } from "react-icons/bi";
import { CiBank } from "react-icons/ci";
import { FaCoins, FaGear, FaGift, FaImage, FaMobile } from "react-icons/fa6";
import { IoMdCode } from "react-icons/io";
import { IoChatbubbles, IoGameController } from "react-icons/io5";
import {
    PiHandDepositFill,
    PiHandWithdrawFill,
    PiPasswordBold,
} from "react-icons/pi";

import { GiPlatform } from "react-icons/gi";
import {
    MdAccountCircle,
    MdEmail,
    MdOutlineAccountBalanceWallet,
} from "react-icons/md";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import useCurrentUser from "@/hook/useCurrentUser";
import Link from "next/link";
import { usePathname } from "next/navigation";

const getNavItems = (isSubAdmin: boolean) => {
  if (isSubAdmin) {
    return [
      {
        label: "Agency Dashboard",
        link: "/",
        isActive: false,
        icon: MdDashboard,
      },
      {
        label: "My Banking Numbers",
        link: "/add-banking",
        isActive: false,
        icon: CiBank,
      },
      {
        label: "Player Transactions",
        isActive: false,
        icon: MdOutlinePayment,
        subMenu: [
          {
            label: "Player Deposits",
            link: "/deposits",
            isActive: false,
            icon: PiHandDepositFill,
          },
          {
            label: "Player Withdraws",
            link: "/withdraws",
            isActive: false,
            icon: PiHandWithdrawFill,
          },
        ],
      },
      {
        label: "My Players",
        link: "/users",
        isActive: false,
        icon: HiMiniUsers,
      },
      {
        label: "Player Bet History",
        link: "/bet-history",
        isActive: false,
        icon: IoGameController,
      },
      {
        label: "Referral & Profile",
        link: "/sub-admins",
        isActive: false,
        icon: BiWorld,
      },
      {
        label: "Setting",
        isActive: false,
        icon: FaGear,
        subMenu: [
          {
            label: "Account",
            link: "/account",
            isActive: false,
            icon: MdAccountCircle,
          },
          {
            label: "Password",
            link: "/account/password",
            isActive: false,
            icon: PiPasswordBold,
          },
        ],
      },
      {
        label: "Support Line",
        link: "/support",
        isActive: false,
        icon: IoChatbubbles,
      },
    ];
  }

  // Super Admin nav (All items)
  return [
    {
      label: "Dashboard",
      link: "/",
      isActive: false,
      icon: MdDashboard,
    },
    {
      label: "Payment",
      isActive: false,
      icon: MdOutlinePayment,
      subMenu: [
        {
          label: "Add Banking",
          link: "/add-banking",
          isActive: false,
          icon: CiBank,
        },
        {
          label: "Deposits",
          link: "/deposits",
          isActive: false,
          icon: PiHandDepositFill,
        },
        {
          label: "Withdraws",
          link: "/withdraws",
          isActive: false,
          icon: PiHandWithdrawFill,
        },
      ],
    },
    {
      label: "Users",
      isActive: false,
      icon: HiMiniUsers,
      subMenu: [
        {
          label: "All Users",
          link: "/users",
          isActive: false,
          icon: HiMiniUsers,
        },
      ],
    },
    {
      label: "Platform",
      isActive: false,
      icon: GiPlatform,
      subMenu: [
        {
          label: "Site",
          link: "/site",
          isActive: false,
          icon: BiWorld,
        },
        {
          label: "Banners & Sliders",
          link: "/banners",
          isActive: false,
          icon: FaImage,
        },
        {
          label: "Promotions & Wheel",
          link: "/promotions",
          isActive: false,
          icon: FaGift,
        },
        {
          label: "Bonus & Mission Control",
          link: "/bonus-missions",
          isActive: false,
          icon: FaCoins,
        },
        {
          label: "Sub-Admins (Agents)",
          link: "/sub-admins",
          isActive: false,
          icon: HiMiniUsers,
        },
        {
          label: "App Version & Update",
          link: "/app-version",
          isActive: false,
          icon: FaMobile,
        },
      ],
    },
    {
      label: "Setting",
      isActive: false,
      icon: FaGear,
      subMenu: [
        {
          label: "Account",
          link: "/account",
          isActive: false,
          icon: MdAccountCircle,
        },
        {
          label: "Password",
          link: "/account/password",
          isActive: false,
          icon: PiPasswordBold,
        },
        {
          label: "Email",
          link: "/account/email",
          isActive: false,
          icon: MdEmail,
        },
      ],
    },
    {
      label: "User Recharge",
      link: "/recharge",
      isActive: false,
      icon: MdOutlineAccountBalanceWallet,
    },
    {
      label: "Games & Providers",
      link: "/games-management",
      isActive: false,
      icon: IoGameController,
    },
    {
      label: "Bet History",
      link: "/bet-history",
      isActive: false,
      icon: IoGameController,
    },
    {
      label: "Casino SoftAPI",
      link: "/casino-api",
      isActive: false,
      icon: IoMdCode,
    },
    {
      label: "Support Line",
      link: "/support",
      isActive: false,
      icon: IoChatbubbles,
    },
  ];
};

interface MenuProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Menu = ({ isOpen = false, onClose }: MenuProps) => {
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const isSubAdmin = (currentUser as any)?.role === "SUBADMIN";

  const [toggledMenu, setToggledMenu] = useState("");
  const [navData, setNavData] = useState(() => getNavItems(false));

  useEffect(() => {
    if (onClose) onClose();
  }, [pathname]);

  useEffect(() => {
    const items = getNavItems(isSubAdmin);
    items.forEach((s: any) => {
      if (s.subMenu) {
        s.isActive = s.subMenu.some((item: any) => item.link === pathname);
        s.subMenu.forEach((item: any) => {
          item.isActive = item.link === pathname;
        });
      } else {
        s.isActive = pathname === s.link;
      }
    });
    setNavData(items);
  }, [pathname, isSubAdmin]);

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 top-16 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-primary border-r border-gray-800 overflow-y-auto transition-transform duration-300 ease-in-out z-50 shadow-2xl lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Mobile Header indicator inside sidebar */}
        <div className="p-3 border-b border-gray-800/60 lg:hidden flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Navigation Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
            aria-label="Close menu"
          >
            <i className="fa-solid fa-xmark text-sm w-4 text-center"></i>
          </button>
        </div>

        <nav className="p-3 sm:p-4 pb-20 lg:pb-6">
          <ul className="space-y-1.5 sm:space-y-2">
            {navData.map((nav, i) => {
              if (nav.subMenu) {
                return (
                  <li key={i}>
                    <Collapsible onOpenChange={() => setToggledMenu(nav.label)}>
                      <CollapsibleTrigger
                        asChild
                        className={`${
                          nav.isActive &&
                          "bg-blue-600 hover:!bg-blue-700 !rounded-button text-white"
                        }`}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-between text-left !rounded-button whitespace-nowrap text-sm"
                        >
                          <span className="flex items-center gap-2.5">
                            <nav.icon className="w-5 h-5 shrink-0" />
                            <span className="truncate">{nav.label}</span>
                          </span>
                          <i
                            className={`fa-solid fa-chevron-${
                              toggledMenu == nav.label ? "down" : "right"
                            } text-xs`}
                          ></i>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-6 space-y-1 mt-1">
                        {nav.subMenu.map((submenu, j) => (
                          <Link
                            href={submenu.link}
                            key={j}
                            onClick={handleLinkClick}
                            className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-lg text-sm justify-start hover:text-white hover:bg-white/5 transition-colors text-left !rounded-button whitespace-nowrap ${
                              submenu.isActive
                                ? "text-blue-400 font-medium bg-blue-600/10"
                                : "text-gray-300"
                            }`}
                          >
                            <submenu.icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{submenu.label}</span>
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                );
              } else {
                return (
                  <li key={i}>
                    <Link
                      href={nav.link}
                      onClick={handleLinkClick}
                      prefetch={nav.link === "/api" ? false : undefined}
                      className={`w-full flex gap-2.5 items-center justify-start text-left px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                        nav.isActive
                          ? "bg-blue-600 text-white font-medium hover:bg-blue-700"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      } !rounded-button whitespace-nowrap`}
                    >
                      <nav.icon className="w-5 h-5 shrink-0" />
                      <span className="truncate">{nav.label}</span>
                    </Link>
                  </li>
                );
              }
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Menu;
