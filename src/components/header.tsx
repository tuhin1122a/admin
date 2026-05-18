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
const Header = () => {
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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 bg-primary border-b  border-b-gray-800
         flex items-center justify-between px-4 lg:px-6`}
    >
      <div className="flex items-center">
        <div className="text-2xl font-bold mr-2 text-blue-500">
          <i className="fa-solid fa-dice"></i>
        </div>
        <h1 className="text-xl font-bold"> Admin Panel</h1>
      </div>
      <div className="flex items-center space-x-4">
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
