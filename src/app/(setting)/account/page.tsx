"use client";
import React, { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useCurrentUser from "@/hook/useCurrentUser";
import { FaPen } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { Input } from "@/components/ui/input";
import { FaCheck } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { nameChange } from "@/action/account";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";
import Link from "next/link";
import { IoLogOutSharp } from "react-icons/io5";
import { logout } from "@/action/logout";

const Account = () => {
  const admin = useCurrentUser();
  const profile = {
    name: admin?.name,
    email: admin?.email,
    accessType: "Admin",
    lastLogin: "May 25, 2025 at 10:45 AM",
    joinDate: "January 15, 2023",
    profileImage: "",
  };
  const [pending, startTr] = useTransition();
  const [nameEditable, setNameEditable] = useState(false);
  const [name, setName] = useState(profile.name);

  const handleNameChange = () => {
    startTr(() => {
      nameChange({ name: name! })
        .then((res) => {
          if (res.success) {
          } else if (res.error) {
            toast.error(res.error);
          }
        })
        .catch(() => {
          toast.error(INTERNAL_SERVER_ERROR);
        });
      setNameEditable(false);
    });
  };

  const handleLogout = () => {
    if (confirm("Logout?")) {
      startTr(() => {
        logout().then((res) => {
          if (res.success) {
            location.reload();
          } else if (res.error) {
            toast.error(res.error);
          }
        });
      });
    }
  };

  return (
    <div>
      {" "}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold  text-white">Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your account information
          </p>
          <Separator className="mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="md:col-span-2">
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-32 w-32 mb-4">
                      <AvatarImage
                        src={profile.profileImage}
                        alt={profile.name}
                      />
                      <AvatarFallback className="text-2xl">AD</AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-500">
                          Full Name
                        </label>
                        <Button
                          variant={"outline"}
                          size={"sm"}
                          disabled={pending}
                          onClick={() => setNameEditable(!nameEditable)}
                        >
                          {nameEditable ? (
                            <IoMdClose className="text-white text-xs" />
                          ) : (
                            <FaPen className="text-white text-xs" />
                          )}
                        </Button>
                      </div>
                      {nameEditable && (
                        <div className="flex items-center gap-2">
                          <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-[80%]"
                            placeholder="Enter name"
                          />
                          <Button
                            variant={"primary"}
                            disabled={pending}
                            onClick={() => handleNameChange()}
                          >
                            <FaCheck className="text-white" />
                          </Button>
                        </div>
                      )}
                      {!nameEditable && (
                        <p className="text-base ">{profile.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Email Address
                      </label>

                      <p className="text-base ">{profile.email}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Access Type
                      </label>
                      <div className="flex items-center mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {profile.accessType}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-end">
                <Button
                  onClick={() => handleLogout()}
                  variant="destructive"
                  disabled={pending}
                  className="!rounded-button whitespace-nowrap cursor-pointer"
                >
                  <IoLogOutSharp className="mr-2 w-5 h-5" /> Logout
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="md:col-span-1">
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Account Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Last Login
                    </label>
                    <p className="text-sm ">{profile.lastLogin}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Member Since
                    </label>
                    <p className="text-sm ">{profile.joinDate}</p>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Security
                    </h3>
                    <Link href="/account/password">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full !rounded-button whitespace-nowrap cursor-pointer mb-2"
                      >
                        <i className="fas fa-lock mr-2"></i>
                        Change Password
                      </Button>
                    </Link>
                    <Link href="/account/email">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full !rounded-button whitespace-nowrap cursor-pointer"
                      >
                        <MdEmail className="text-white" /> Change Email
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md mt-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium ">Current Session</p>
                      <p className="text-xs text-gray-500">Windows • Chrome</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
