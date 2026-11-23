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

  const admin = useCurrentUser();

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
        <div className="relative cursor-pointer">
          <i className="fa-solid fa-bell text-lg"></i>
          {/* <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            5
          </span> */}
        </div>

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
