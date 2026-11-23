"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface UserPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    phone?: string;
    playerId?: string;
    name?: string;
  } | null;
  onSuccess?: () => void;
}

export function UserPasswordModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserPasswordModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "withdraw">("login");

  // Login Password state
  const [newLoginPassword, setNewLoginPassword] = useState("");
  const [confirmLoginPassword, setConfirmLoginPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [savingLogin, setSavingLogin] = useState(false);

  // Withdraw Password state
  const [newWithdrawPassword, setNewWithdrawPassword] = useState("");
  const [confirmWithdrawPassword, setConfirmWithdrawPassword] = useState("");
  const [showWithdrawPass, setShowWithdrawPass] = useState(false);
  const [savingWithdraw, setSavingWithdraw] = useState(false);

  const resetForm = () => {
    setNewLoginPassword("");
    setConfirmLoginPassword("");
    setNewWithdrawPassword("");
    setConfirmWithdrawPassword("");
  };

  const handleUpdateLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newLoginPassword || newLoginPassword.trim().length < 6) {
      toast.error("Login password must be at least 6 characters");
      return;
    }

    if (newLoginPassword !== confirmLoginPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setSavingLogin(true);
      const res = await fetch(`/api/users/${user.id}/passwords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_login_password",
          newPassword: newLoginPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Login password updated successfully!");
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || "Failed to update login password");
      }
    } catch {
      toast.error("Network error while updating login password");
    } finally {
      setSavingLogin(false);
    }
  };

  const handleUpdateWithdrawPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newWithdrawPassword || newWithdrawPassword.trim().length < 4) {
      toast.error("Withdraw PIN/Password must be at least 4 characters");
      return;
    }

    if (newWithdrawPassword !== confirmWithdrawPassword) {
      toast.error("Withdraw passwords do not match");
      return;
    }

    try {
      setSavingWithdraw(true);
      const res = await fetch(`/api/users/${user.id}/passwords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_withdraw_password",
          newWithdrawPassword: newWithdrawPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          data.message || "Withdraw PIN/Password updated successfully!"
        );
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || "Failed to update withdraw password");
      }
    } catch {
      toast.error("Network error while updating withdraw password");
    } finally {
      setSavingWithdraw(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="w-5 h-5 text-amber-400" />
            Manage User Passwords
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-400">
            Player: <span className="font-semibold text-white">{user?.name || "Player"}</span>{" "}
            ({user?.phone || user?.playerId})
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "login" | "withdraw")}
          className="w-full mt-2"
        >
          <TabsList className="grid w-full grid-cols-2 bg-gray-950 p-1 border border-gray-800">
            <TabsTrigger
              value="login"
              className="text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-black font-semibold"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              Login Password
            </TabsTrigger>
            <TabsTrigger
              value="withdraw"
              className="text-xs data-[state=active]:bg-emerald-500 data-[state=active]:text-black font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              Withdraw PIN
            </TabsTrigger>
          </TabsList>

          {/* Login Password Form */}
          <TabsContent value="login" className="pt-3">
            <form onSubmit={handleUpdateLoginPassword} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                Change user&apos;s account login password. The player will use this password to sign into the game app.
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300">New Login Password</Label>
                <div className="relative">
                  <Input
                    type={showLoginPass ? "text" : "password"}
                    placeholder="Enter at least 6 characters"
                    value={newLoginPassword}
                    onChange={(e) => setNewLoginPassword(e.target.value)}
                    className="bg-gray-950 border-gray-800 pr-10 text-xs"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showLoginPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300">Confirm Password</Label>
                <Input
                  type={showLoginPass ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmLoginPassword}
                  onChange={(e) => setConfirmLoginPassword(e.target.value)}
                  className="bg-gray-950 border-gray-800 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-700 bg-gray-800 text-white text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingLogin || !newLoginPassword}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
                >
                  {savingLogin ? "Updating..." : "Update Login Password"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Withdraw Password Form */}
          <TabsContent value="withdraw" className="pt-3">
            <form onSubmit={handleUpdateWithdrawPassword} className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
                Change user&apos;s withdrawal password/PIN. This protects bank card and cash-out operations in the player app.
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300">New Withdraw Password / PIN</Label>
                <div className="relative">
                  <Input
                    type={showWithdrawPass ? "text" : "password"}
                    placeholder="Enter at least 4 digits or characters"
                    value={newWithdrawPassword}
                    onChange={(e) => setNewWithdrawPassword(e.target.value)}
                    className="bg-gray-950 border-gray-800 pr-10 text-xs font-mono"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWithdrawPass(!showWithdrawPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showWithdrawPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300">Confirm Withdraw PIN</Label>
                <Input
                  type={showWithdrawPass ? "text" : "password"}
                  placeholder="Re-enter withdraw PIN"
                  value={confirmWithdrawPassword}
                  onChange={(e) => setConfirmWithdrawPassword(e.target.value)}
                  className="bg-gray-950 border-gray-800 text-xs font-mono"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-700 bg-gray-800 text-white text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingWithdraw || !newWithdrawPassword}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                >
                  {savingWithdraw ? "Updating..." : "Update Withdraw PIN"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
