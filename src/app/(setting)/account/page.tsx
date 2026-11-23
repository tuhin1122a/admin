"use client";
import React, { useState, useTransition, useEffect, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import useCurrentUser from "@/hook/useCurrentUser";
import { FaPen } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaCheck } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { nameChange } from "@/action/account";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";
import Link from "next/link";
import { IoLogOutSharp } from "react-icons/io5";
import { logout } from "@/action/logout";
import moment from "moment";

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

  // Mother Admin and Sub-Admin Management
  const isSuperAdmin = (admin as any)?.role === "ADMIN";
  const [adminAccounts, setAdminAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createRole, setCreateRole] = useState<"ADMIN" | "SUBADMIN">("ADMIN");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createAgentCode, setCreateAgentCode] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);

  const fetchAdminAccounts = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      setLoadingAccounts(true);
      const res = await fetch("/api/admin/accounts");
      const data = await res.json();
      if (data?.success) {
        setAdminAccounts(data.accounts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAccounts(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchAdminAccounts();
  }, [fetchAdminAccounts]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createEmail || !createPassword) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      setCreatingAccount(true);
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword,
          role: createRole,
          phone: createPhone,
          agentCode: createAgentCode,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(data.message || "Admin account created successfully");
        setIsCreateModalOpen(false);
        setCreateName("");
        setCreateEmail("");
        setCreatePassword("");
        setCreatePhone("");
        setCreateAgentCode("");
        fetchAdminAccounts();
      } else {
        toast.error(data?.error || "Failed to create admin");
      }
    } catch {
      toast.error("Failed to create admin");
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleDeleteAccount = async (
    id: string,
    accountName: string,
    role: string
  ) => {
    const roleLabel = role === "ADMIN" ? "Mother Admin" : "Sub-Admin";
    if (
      !confirm(
        `Are you sure you want to permanently delete ${roleLabel} "${accountName}"?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/accounts?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data?.success) {
        toast.success(data.message || "Account deleted successfully");
        fetchAdminAccounts();
      } else {
        toast.error(data?.error || "Failed to delete account");
      }
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const handleNameChange = () => {
    startTr(() => {
      nameChange({ name: name! })
        .then((res) => {
          if (res.success) {
            toast.success("Name updated successfully");
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

        {/* Mother Admin & Sub-Admin Accounts Management (Visible to Super Admin) */}
        {isSuperAdmin && (
          <Card className="shadow-md mt-8 bg-primary border-gray-800">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
              <div>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <span>Admin &amp; Management Accounts</span>
                  <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs">
                    {adminAccounts.length} Total
                  </Badge>
                </CardTitle>
                <p className="text-xs text-gray-400 mt-1">
                  Manage Mother Admins (Super Admins) and Sub-Admins with full creation and deletion controls.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchAdminAccounts}
                  className="border-gray-700 bg-gray-800 text-white text-xs cursor-pointer"
                >
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setCreateRole("ADMIN");
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs !rounded-button cursor-pointer"
                >
                  <i className="fas fa-plus mr-1.5"></i> Create Mother Admin
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="font-semibold text-gray-300">Name &amp; Email</TableHead>
                      <TableHead className="font-semibold text-gray-300">Role</TableHead>
                      <TableHead className="font-semibold text-gray-300">Identifier / Phone</TableHead>
                      <TableHead className="font-semibold text-gray-300">Created At</TableHead>
                      <TableHead className="text-right font-semibold text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminAccounts.map((acc) => {
                      const isMe = acc.id === admin?.id;
                      return (
                        <TableRow key={acc.id} className="border-gray-800/80 hover:bg-gray-800/40">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                                {acc.name}
                                {isMe && (
                                  <Badge className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0 border border-blue-500/30">
                                    You (Current)
                                  </Badge>
                                )}
                              </span>
                              <span className="text-xs text-gray-400 font-mono mt-0.5">{acc.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs ${
                                acc.role === "ADMIN"
                                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                                  : "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                              }`}
                            >
                              {acc.role === "ADMIN" ? "Mother Admin" : "Sub-Admin"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-400">
                            {acc.role === "SUBADMIN" && acc.agentCode && (
                              <span className="text-amber-400 block font-semibold">Agent: {acc.agentCode}</span>
                            )}
                            {acc.phone ? acc.phone : "No phone"}
                          </TableCell>
                          <TableCell className="text-xs text-gray-400">
                            {moment(acc.createdAt).format("DD MMM YYYY")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isMe}
                              onClick={() => handleDeleteAccount(acc.id, acc.name, acc.role)}
                              className={`h-8 px-2.5 text-xs ${
                                isMe
                                  ? "text-gray-600 cursor-not-allowed"
                                  : "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                              }`}
                              title={isMe ? "You cannot delete your own logged-in account" : "Delete account"}
                            >
                              <i className="fas fa-trash-alt mr-1"></i> Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Mother Admin / Sub-Admin Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-md bg-gray-950 border border-gray-800 text-white">
            <DialogHeader className="border-b border-gray-800 pb-3">
              <DialogTitle className="text-lg text-white">Create Admin Account</DialogTitle>
              <DialogDescription className="text-xs text-gray-400 mt-1">
                Create a new Mother Admin (full super-admin privileges) or Sub-Admin (agent) account.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateAccount} className="space-y-4 pt-2">
              <div>
                <Label className="text-xs font-medium text-gray-300">Account Role *</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={createRole === "ADMIN" ? "default" : "outline"}
                    onClick={() => setCreateRole("ADMIN")}
                    className={`text-xs ${createRole === "ADMIN" ? "bg-purple-600 text-white" : "border-gray-700 bg-gray-900"}`}
                  >
                    👑 Mother Admin
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={createRole === "SUBADMIN" ? "default" : "outline"}
                    onClick={() => setCreateRole("SUBADMIN")}
                    className={`text-xs ${createRole === "SUBADMIN" ? "bg-blue-600 text-white" : "border-gray-700 bg-gray-900"}`}
                  >
                    👤 Sub-Admin (Agent)
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="adminName" className="text-xs font-medium text-gray-300">Full Name *</Label>
                <Input
                  id="adminName"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Master Admin 2"
                  required
                  className="mt-1 bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="adminEmail" className="text-xs font-medium text-gray-300">Email Address *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="admin2@example.com"
                  required
                  className="mt-1 bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="adminPass" className="text-xs font-medium text-gray-300">Password * (min 6 chars)</Label>
                <Input
                  id="adminPass"
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="mt-1 bg-gray-900 border-gray-700 text-white"
                />
              </div>

              {createRole === "SUBADMIN" && (
                <div>
                  <Label htmlFor="adminAgentCode" className="text-xs font-medium text-gray-300">Agent Referral Code</Label>
                  <Input
                    id="adminAgentCode"
                    value={createAgentCode}
                    onChange={(e) => setCreateAgentCode(e.target.value)}
                    placeholder="e.g. AGENT007"
                    className="mt-1 bg-gray-900 border-gray-700 text-white uppercase font-mono"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="adminPhone" className="text-xs font-medium text-gray-300">Phone Number (Optional)</Label>
                <Input
                  id="adminPhone"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  placeholder="+880 1700 000000"
                  className="mt-1 bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <DialogFooter className="pt-3 border-t border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-gray-700 text-gray-300 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creatingAccount}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  {creatingAccount ? "Creating..." : `Create ${createRole === "ADMIN" ? "Mother Admin" : "Sub-Admin"}`}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Account;
