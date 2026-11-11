"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import CookieLoader from "@/components/loaders/cookie-loader";
import { toast } from "sonner";
import Link from "next/link";

interface SubAdminItem {
  id: string;
  name: string;
  email: string;
  role: string;
  agentCode: string;
  phone: string;
  isActive: boolean;
  commissionRate: number;
  referralLink: string;
  playerCount: number;
  customWalletsCount: number;
  totalDeposits: number;
  totalWithdraws: number;
  netProfit: number;
  createdAt: string;
}

export default function SubAdminsManagementPage() {
  const [loading, setLoading] = useState(true);
  const [subAdmins, setSubAdmins] = useState<SubAdminItem[]>([]);
  const [isSubAdminView, setIsSubAdminView] = useState(false);

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createAgentCode, setCreateAgentCode] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createCommission, setCreateCommission] = useState("5");
  const [creating, setCreating] = useState(false);

  // Edit / Password Modal state
  const [editAdmin, setEditAdmin] = useState<SubAdminItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchSubAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sub-admins");
      const data = await res.json();
      if (data?.success && data?.subAdmins) {
        setSubAdmins(data.subAdmins);
        setIsSubAdminView(Boolean(data.isSubAdminView));
      } else {
        toast.error(data?.error || "Failed to load sub-admins");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load sub-admins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubAdmins();
  }, [fetchSubAdmins]);

  const handleCopyLink = (link: string, code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      toast.success(`Copied referral link for Agent [${code}]!`);
    } else {
      toast.info(link);
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createEmail || !createPassword) {
      toast.error("Please fill in Name, Email and Password");
      return;
    }
    try {
      setCreating(true);
      const res = await fetch("/api/sub-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword,
          agentCode: createAgentCode,
          phone: createPhone,
          commissionRate: Number(createCommission) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        toast.error(data?.error || "Failed to create sub-admin");
        return;
      }
      toast.success("New Sub-Admin agent created successfully!");
      setIsCreateOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateAgentCode("");
      setCreatePhone("");
      await fetchSubAdmins();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create sub-admin");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdmin) return;
    try {
      setSavingEdit(true);
      const res = await fetch("/api/sub-admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editAdmin.id,
          name: editName,
          phone: editPhone,
          newPassword: editNewPassword.trim() ? editNewPassword.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        toast.error(data?.error || "Failed to update agent");
        return;
      }
      toast.success("Agent details updated successfully!");
      setEditAdmin(null);
      await fetchSubAdmins();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update agent");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading && subAdmins.length === 0) {
    return (
      <div className="flex w-full h-[70vh] justify-center items-center">
        <CookieLoader />
      </div>
    );
  }

  const totalAgents = subAdmins.length;
  const totalPlayers = subAdmins.reduce((acc, s) => acc + s.playerCount, 0);
  const totalDeposits = subAdmins.reduce((acc, s) => acc + s.totalDeposits, 0);
  const totalWithdraws = subAdmins.reduce((acc, s) => acc + s.totalWithdraws, 0);

  return (
    <div className="space-y-6 pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-slate-900 to-blue-950/40 p-6 rounded-xl border border-blue-500/20">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
              Master Agent &amp; Agency System
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Franchise Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Sub-Admins &amp; Agent Management
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Sub-admins share their unique referral link. Players who register via that link see only that agent&apos;s custom payment numbers.
          </p>
        </div>
        {!isSubAdminView && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            + Create New Sub-Admin
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Sub-Admins (Agents)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalAgents}</div>
            <p className="text-xs text-gray-400 mt-1">Active franchise accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Tagged Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-400">{totalPlayers}</div>
            <p className="text-xs text-gray-400 mt-1">Registered via agent links</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Agents&apos; Player Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              ৳ {totalDeposits.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400 mt-1">Approved agent deposits</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/90 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Agents&apos; Player Withdraws
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">
              ৳ {totalWithdraws.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400 mt-1">Approved agent cashouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="bg-gray-900/90 border-gray-800">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <CardTitle className="text-lg text-white">Sub-Admin (Agent) Accounts</CardTitle>
            <CardDescription className="text-xs text-gray-400 mt-0.5">
              Unique agent referral links and custom payment numbers configuration.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSubAdmins} className="border-gray-700 bg-gray-800 text-white">
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="font-semibold text-gray-300">Agent Name &amp; Email</TableHead>
                  <TableHead className="font-semibold text-gray-300">Agent Code</TableHead>
                  <TableHead className="font-semibold text-gray-300">Shareable Registration Link</TableHead>
                  <TableHead className="font-semibold text-gray-300">Tagged Players</TableHead>
                  <TableHead className="font-semibold text-gray-300">Deposits / Withdraws</TableHead>
                  <TableHead className="font-semibold text-gray-300">Payment Numbers</TableHead>
                  <TableHead className="font-semibold text-gray-300">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subAdmins.map((sub) => (
                  <TableRow key={sub.id} className="border-gray-800/80 hover:bg-gray-800/40">
                    {/* Agent Name & Email */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{sub.name}</span>
                        <span className="text-xs text-gray-400 font-mono mt-0.5">{sub.email}</span>
                        {sub.phone && <span className="text-[11px] text-gray-500 font-mono">{sub.phone}</span>}
                      </div>
                    </TableCell>

                    {/* Agent Code */}
                    <TableCell>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-mono text-xs">
                        {sub.agentCode}
                      </Badge>
                    </TableCell>

                    {/* Referral Link with Copy */}
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[280px]">
                        <span className="text-xs font-mono text-amber-300 truncate bg-gray-950 px-2.5 py-1 rounded border border-gray-800 select-all">
                          {sub.referralLink}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(sub.referralLink, sub.agentCode)}
                          className="h-7 px-2 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10 shrink-0"
                          title="Copy Share Link"
                        >
                          Copy
                        </Button>
                      </div>
                    </TableCell>

                    {/* Tagged Players */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold font-mono text-white">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        {sub.playerCount}{" "}
                        <span className="text-xs font-normal text-gray-400">users</span>
                      </div>
                    </TableCell>

                    {/* Financials */}
                    <TableCell>
                      <div className="flex flex-col text-xs font-mono space-y-0.5">
                        <span className="text-emerald-400">+ ৳ {sub.totalDeposits.toLocaleString()}</span>
                        <span className="text-rose-400">- ৳ {sub.totalWithdraws.toLocaleString()}</span>
                        <span className={`text-[11px] font-semibold ${sub.netProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                          Net: ৳ {sub.netProfit.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>

                    {/* Custom Payment Numbers */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={
                            sub.customWalletsCount > 0
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs"
                              : "bg-gray-800 text-gray-400 border-gray-700 text-xs"
                          }
                        >
                          {sub.customWalletsCount > 0
                            ? `${sub.customWalletsCount} Custom Numbers`
                            : "Default Site Numbers"}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          sub.isActive
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs"
                            : "bg-red-500/15 text-red-400 border-red-500/30 text-xs"
                        }
                      >
                        {sub.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/add-banking?subAdminId=${sub.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                            title="Manage Banking Numbers for this Agent"
                          >
                            Set Banking
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditAdmin(sub);
                            setEditName(sub.name);
                            setEditPhone(sub.phone);
                            setEditNewPassword("");
                          }}
                          className="h-8 px-2 text-xs text-gray-300 hover:text-white"
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {subAdmins.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-gray-500 text-sm">
                      No sub-admins found. Click &ldquo;+ Create New Sub-Admin&rdquo; above to add your first master agent!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE SUB-ADMIN MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Create New Sub-Admin (Agent)</DialogTitle>
            <DialogDescription className="text-gray-400 text-xs">
              Add a new franchise master agent. They can share their referral link and manage their own players.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubAdmin} className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Agent Name *</Label>
              <Input
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Master Agent Dhaka"
                className="bg-gray-950 border-gray-800 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Email Address *</Label>
              <Input
                type="email"
                required
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="e.g. agent101@example.com"
                className="bg-gray-950 border-gray-800 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Password *</Label>
              <Input
                type="password"
                required
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="bg-gray-950 border-gray-800 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Unique Agent Code</Label>
                <Input
                  value={createAgentCode}
                  onChange={(e) => setCreateAgentCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUB102"
                  className="bg-gray-950 border-gray-800 mt-1 font-mono uppercase"
                />
              </div>
              <div>
                <Label className="text-xs">Phone Number</Label>
                <Input
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  placeholder="01700000000"
                  className="bg-gray-950 border-gray-800 mt-1 font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Commission Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={createCommission}
                onChange={(e) => setCreateCommission(e.target.value)}
                placeholder="5"
                className="bg-gray-950 border-gray-800 mt-1"
              />
            </div>
            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="border-gray-700 bg-gray-800 text-white"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {creating ? "Creating..." : "Create Agent"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT SUB-ADMIN MODAL */}
      <Dialog open={Boolean(editAdmin)} onOpenChange={(open) => !open && setEditAdmin(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Edit Agent ({editAdmin?.name})</DialogTitle>
            <DialogDescription className="text-gray-400 text-xs">
              Update contact info or reset password for this sub-admin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Agent Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-gray-950 border-gray-800 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Phone Number</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="bg-gray-950 border-gray-800 mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs">Reset Password (leave blank to keep current)</Label>
              <Input
                type="password"
                value={editNewPassword}
                onChange={(e) => setEditNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-gray-950 border-gray-800 mt-1"
              />
            </div>
            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditAdmin(null)}
                className="border-gray-700 bg-gray-800 text-white"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
