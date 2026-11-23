"use client";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useCurrentUser from "@/hook/useCurrentUser";
import Link from "next/link";
import { logout } from "@/action/logout";
import { toast } from "sonner";
interface HeaderProps {
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

const Header = ({ isMobileMenuOpen, onToggleMobileMenu }: HeaderProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifData, setNotifData] = useState<{
    pendingDeposits: number;
    pendingWithdraws: number;
    totalAlerts: number;
    recentNotifications: any[];
  }>({
    pendingDeposits: 0,
    pendingWithdraws: 0,
    totalAlerts: 0,
    recentNotifications: [],
  });

  const admin = useCurrentUser();

  const fetchAlerts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data?.success) {
        setNotifData({
          pendingDeposits: data.pendingDeposits || 0,
          pendingWithdraws: data.pendingWithdraws || 0,
          totalAlerts: data.totalAlerts || 0,
          recentNotifications: data.recentNotifications || [],
        });
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 20000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleLogout = () => {
    if (confirm("Logout?")) {
      logout().then((res) => {
        if (res.success) {
          location.reload();
        } else if (res.error) {
          toast.error(res.error);
        }
      });
    }
  };

  const isSuperAdmin = (admin as any)?.role === "ADMIN";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 bg-primary border-b border-b-gray-800
         flex items-center justify-between px-3 sm:px-4 lg:px-6 shadow-md`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Drawer Toggle */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <i
              className={`fa-solid ${
                isMobileMenuOpen ? "fa-xmark" : "fa-bars"
              } text-lg w-5 text-center`}
            ></i>
          </button>
        )}

        <div className="text-xl sm:text-2xl font-bold text-blue-500 shrink-0">
          <i className="fa-solid fa-dice"></i>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-bold truncate text-white">
            Admin Panel
          </h1>
          {admin && (
            <span
              className={`hidden xs:inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                isSuperAdmin
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  : "bg-blue-500/15 text-blue-300 border-blue-500/30"
              }`}
            >
              {isSuperAdmin ? "Master" : "Agent"}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-3 sm:space-x-4">
        <DropdownMenu open={isNotifOpen} onOpenChange={setIsNotifOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer focus:outline-none"
              title="Notifications & Alerts"
            >
              <i className="fa-solid fa-bell text-lg"></i>
              {notifData.totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center animate-pulse">
                  {notifData.totalAlerts > 99 ? "99+" : notifData.totalAlerts}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-80 bg-gray-900 border-gray-800 text-white p-2"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-semibold text-xs text-gray-300 flex items-center justify-between pb-2 border-b border-gray-800">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-bell text-amber-400"></i>
                Alerts &amp; Notifications
              </span>
              {notifData.totalAlerts > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {notifData.totalAlerts} Pending Action{notifData.totalAlerts > 1 ? "s" : ""}
                </span>
              )}
            </DropdownMenuLabel>

            {/* Quick Actions for Pending Deposits & Withdrawals */}
            <div className="py-2 space-y-1">
              <Link href="/deposits" onClick={() => setIsNotifOpen(false)}>
                <div className="p-2 rounded-md hover:bg-gray-800 flex items-center justify-between transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-arrow-down"></i>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Pending Deposits</div>
                      <div className="text-[10px] text-gray-400">Review player cash-ins</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                      notifData.pendingDeposits > 0
                        ? "bg-emerald-500 text-black"
                        : "text-gray-500"
                    }`}
                  >
                    {notifData.pendingDeposits}
                  </span>
                </div>
              </Link>

              <Link href="/withdraws" onClick={() => setIsNotifOpen(false)}>
                <div className="p-2 rounded-md hover:bg-gray-800 flex items-center justify-between transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-arrow-up"></i>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Pending Withdrawals</div>
                      <div className="text-[10px] text-gray-400">Process player cash-outs</div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                      notifData.pendingWithdraws > 0
                        ? "bg-rose-500 text-white"
                        : "text-gray-500"
                    }`}
                  >
                    {notifData.pendingWithdraws}
                  </span>
                </div>
              </Link>
            </div>

            <DropdownMenuSeparator className="bg-gray-800 my-1" />

            {/* Recent Notifications Stream */}
            <div className="px-1 py-1">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Recent Player Notifications
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {notifData.recentNotifications.length > 0 ? (
                  notifData.recentNotifications.slice(0, 5).map((n: any) => (
                    <div
                      key={n.id}
                      className="p-1.5 rounded bg-gray-950/70 border border-gray-800 text-[11px] space-y-0.5"
                    >
                      <div className="flex justify-between items-center text-gray-300">
                        <span className="font-semibold text-amber-300 truncate max-w-[170px]">
                          {n.title}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono">
                          {n.user?.phone || "Player"}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-2">
                        {n.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-gray-500 py-2 text-center">
                    No recent notifications
                  </div>
                )}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full !rounded-button cursor-pointer whitespace-nowrap"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={`w-56 `} align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {admin?.name}
                </p>
                <p className="text-xs leading-none text-gray-500">
                  {admin?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Link href="/account">
                {" "}
                <i className="fa-solid fa-user mr-2"></i> Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Link href="/account">
                <i className="fa-solid fa-gear mr-2"></i> Account
              </Link>
            </DropdownMenuItem>
            {/* <DropdownMenuItem className="cursor-pointer">
              <i className="fa-solid fa-bell mr-2"></i> Notifications
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-500">
              <button onClick={() => handleLogout()}>
                <i className="fa-solid fa-right-from-bracket mr-2"></i> Logout
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
