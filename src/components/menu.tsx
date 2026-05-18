"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";

import { MdDashboard, MdOutlinePayment } from "react-icons/md";
import { HiMiniUsers } from "react-icons/hi2";

import { FaGear } from "react-icons/fa6";
import { IoMdCode } from "react-icons/io";
import { IoChatbubbles } from "react-icons/io5";
import { CiBank } from "react-icons/ci";
import {
  PiHandDepositFill,
  PiHandWithdrawFill,
  PiPasswordBold,
} from "react-icons/pi";
import { BiWorld } from "react-icons/bi";

import {
  MdAccountCircle,
  MdEmail,
  MdOutlineAccountBalanceWallet,
} from "react-icons/md";
import { GiPlatform } from "react-icons/gi";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
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
  // {
  //   label: "Agents",
  //   isActive: false,
  //   icon: MdSupportAgent,
  //   subMenu: [
  //     {
  //       label: "Active Agents",
  //       link: "/active-agents",
  //       isActive: false,
  //     },
  //     {
  //       label: "Requests",
  //       link: "/agents-request",
  //       isActive: false,
  //     },
  //     {
  //       label: "Add Agents",
  //       link: "/add-agents",
  //       isActive: false,
  //     },
  //   ],
  // },
  // {
  //   label: "PlatForm",
  //   isActive: false,
  //   icon: TbWorld,
  //   subMenu: [
  //     {
  //       label: "Announcement",
  //       link: "/announcement",
  //       isActive: false,
  //     },
  //     {
  //       label: "Features",
  //       link: "/features",
  //       isActive: false,
  //     },
  //     {
  //       label: "Notice",
  //       link: "/notice",
  //       isActive: false,
  //     },
  //     {
  //       label: "Contact",
  //       link: "/contact",
  //       isActive: false,
  //     },
  //     {
  //       label: "Live Support",
  //       link: "/live-support",
  //       isActive: false,
  //     },
  //     {
  //       label: "Promo",
  //       link: "/promo",
  //       isActive: false,
  //     },
  //   ],
  // },
  // {
  //   label: "Rules",
  //   isActive: false,
  //   icon: FcRules,
  //   subMenu: [
  //     {
  //       label: "Payment",
  //       link: "/payment-rules",
  //       isActive: false,
  //     },
  //     {
  //       label: "Rewards",
  //       link: "/payment-rules",
  //       isActive: false,
  //     },
  //   ],
  // },
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
    label: "API",
    link: "/api",
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

const Menu = () => {
  const pathname = usePathname();
  const [toggledMenu, setToggledMenu] = useState("");

  const [navData, setNavData] = useState(nav);

  useEffect(() => {
    if (pathname) {
      setNavData((state) => {
        const newState = [...state];

        newState.map((s) => {
          if (s.subMenu) {
            s.isActive =
              s.subMenu.filter((item) => {
                if (item.link == pathname) {
                  item.isActive = true;
                  return true;
                } else {
                  item.isActive = false;
                  return false;
                }
              }).length > 0
                ? true
                : false;
          } else {
            s.isActive = pathname == s.link;
          }
        });

        return newState;
      });
    }
  }, [pathname]);

  return (
    <aside
      className={`fixed  top-16 left-0 bottom-0 w-64  bg-primary border-gray-800 overflow-y-auto transition-all duration-300 ease-in-out z-40 `}
    >
      <nav className="p-4">
        <ul className="space-y-2">
          {navData.map((nav, i) => {
            if (nav.subMenu) {
              return (
                <li key={i}>
                  <Collapsible onOpenChange={() => setToggledMenu(nav.label)}>
                    <CollapsibleTrigger
                      asChild
                      className={`${
                        nav.isActive &&
                        "bg-blue-600 hover:!bg-blue-700 !rounded-button"
                      }`}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-left !rounded-button whitespace-nowrap"
                      >
                        <span className="flex items-center gap-2">
                          <nav.icon className="w-8 h-8" />
                          {nav.label}
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
                          className={`w-full flex items-center gap-2 justify-start hover:text-white/50 hover:transition-colors text-left !rounded-button whitespace-nowrap ${
                            submenu.isActive && "text-blue-600"
                          }`}
                        >
                          <submenu.icon className="w-4 h-4 " />
                          {submenu.label}
                        </Link>
                      ))}
                      {/* <Button
                        variant="ghost"
                        className="w-full justify-start text-left !rounded-button whitespace-nowrap"
                      >
                        <i className="fa-solid fa-user-plus mr-2"></i> All Users
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left !rounded-button whitespace-nowrap"
                      >
                        <i className="fa-solid fa-user-check mr-2"></i> Active
                        Users
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left !rounded-button whitespace-nowrap"
                      >
                        <i className="fa-solid fa-user-slash mr-2"></i> Banned
                        Users
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-left !rounded-button whitespace-nowrap"
                      >
                        <i className="fa-solid fa-user-shield mr-2"></i>{" "}
                        Verification
                      </Button> */}
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              );
            } else {
              return (
                <li key={i}>
                  <Link
                    href={nav.link}
                    className={`w-full flex gap-2 items-center justify-start text-left  px-4 py-2 rounded-md ${
                      nav.isActive ? "bg-blue-600 hover:bg-blue-700" : ""
                    } !rounded-button whitespace-nowrap`}
                  >
                    <nav.icon className="w-5 h-5" /> {nav.label}
                  </Link>
                </li>
              );
            }
          })}
          {/* <li>
            <Button
              variant={activeMenuItem === "dashboard" ? "default" : "ghost"}
              className={`w-full justify-start text-left ${
                activeMenuItem === "dashboard"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : ""
              } !rounded-button whitespace-nowrap`}
              onClick={() => setActiveMenuItem("dashboard")}
            >
              <i className="fa-solid fa-gauge-high mr-2"></i> Dashboard
            </Button>
          </li>
          <li>
            <Collapsible
              open={openSubMenus.users}
              onOpenChange={() => toggleSubMenu("users")}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-left !rounded-button whitespace-nowrap"
                >
                  <span>
                    <i className="fa-solid fa-users mr-2"></i> Users Management
                  </span>
                  <i
                    className={`fa-solid fa-chevron-${
                      openSubMenus.users ? "down" : "right"
                    } text-xs`}
                  ></i>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1 mt-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left !rounded-button whitespace-nowrap"
                >
                  <i className="fa-solid fa-user-plus mr-2"></i> All Users
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left !rounded-button whitespace-nowrap"
                >
                  <i className="fa-solid fa-user-check mr-2"></i> Active Users
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left !rounded-button whitespace-nowrap"
                >
                  <i className="fa-solid fa-user-slash mr-2"></i> Banned Users
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left !rounded-button whitespace-nowrap"
                >
                  <i className="fa-solid fa-user-shield mr-2"></i> Verification
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </li>
          <li>
            <Collapsible
              open={openSubMenus.betting}
              onOpenChange={() => toggleSubMenu("betting")}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between text-left !rounded-button whitespace-nowrap"
                >
                  <span>
                    <i className="fa-solid fa-dice mr-2"></i> Betting Management
                  </span>
                  <i
                    className={`fa-solid fa-chevron-${
                      openSubMenus.betting ? "down" : "right"
                    } text-xs`}
                  ></i>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1 mt-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left !rounded-button whitespace-nowrap"
                >
                  <i className="fa-solid fa-trophy mr-2"></i> Matches
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left !rounded-button whitespace-nowrap"
                >
                  <i className="fa-solid fa-money-bill mr-2"></i> Bets
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left !rounded-button whitespace-nowrap"
                >
                  <i className="fa-solid fa-percentage mr-2"></i> Odds
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left !rounded-button whitespace-nowrap"
                >
                  <i className="fa-solid fa-gift mr-2"></i> Promotions
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full justify-start text-left !rounded-button whitespace-nowrap"
              onClick={() => setActiveMenuItem("transactions")}
            >
              <i className="fa-solid fa-money-bill-transfer mr-2"></i>{" "}
              Transactions
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full justify-start text-left !rounded-button whitespace-nowrap"
              onClick={() => setActiveMenuItem("reports")}
            >
              <i className="fa-solid fa-chart-pie mr-2"></i> Reports
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full justify-start text-left !rounded-button whitespace-nowrap"
              onClick={() => setActiveMenuItem("settings")}
            >
              <i className="fa-solid fa-gear mr-2"></i> Settings
            </Button>
          </li> */}
        </ul>
      </nav>
    </aside>
  );
};

export default Menu;
