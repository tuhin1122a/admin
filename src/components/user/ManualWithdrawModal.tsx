"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpRight, DollarSign, Search, Wallet } from "lucide-react";
import { toast } from "sonner";

interface ManualWithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id: string;
    phone?: string;
    playerId?: string;
    name?: string;
    wallet?: {
      balance?: number | string;
    } | null;
  } | null;
  allowUserSearch?: boolean;
  onSuccess?: (result?: any) => void;
}

export function ManualWithdrawModal({
  open,
  onOpenChange,
  user: initialUser,
  allowUserSearch = false,
  onSuccess,
}: ManualWithdrawModalProps) {
  const [selectedUser, setSelectedUser] = useState<any>(initialUser || null);

  // User search state (when allowUserSearch is true)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Form fields
  const [amount, setAmount] = useState("");
  const [paymentWallet, setPaymentWallet] = useState("bKash");
  const [walletNumber, setWalletNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [status, setStatus] = useState<"APPROVED" | "PENDING">("APPROVED");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setSelectedUser(initialUser);
      if (initialUser.phone) {
        setWalletNumber(initialUser.phone);
      }
      if (initialUser.name) {
        setAccountHolderName(initialUser.name);
      }
    }
  }, [initialUser]);

  const currentBalance = Number(
    selectedUser?.wallet?.balance ?? selectedUser?.balance ?? 0
  );
  const withdrawAmount = parseFloat(amount) || 0;
  const isInsufficient = withdrawAmount > currentBalance;
  const remainingBalance = Math.max(0, currentBalance - withdrawAmount);

  // Search users API
  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const res = await fetch(`/api/users?search=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      if (data?.users) {
        setSearchResults(data.users);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUserFromSearch = (u: any) => {
    setSelectedUser(u);
    setWalletNumber(u.phone || "");
    setAccountHolderName(u.name || "Player");
    setSearchResults([]);
    setSearchQuery("");
  };

  const resetForm = () => {
    setAmount("");
    setNote("");
    if (!initialUser) {
      setSelectedUser(null);
      setWalletNumber("");
      setAccountHolderName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?.id) {
      toast.error("Please select a user to withdraw from");
      return;
    }

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error("Please enter a valid withdrawal amount greater than 0");
      return;
    }

    if (withdrawAmount > currentBalance) {
      toast.error(
        `User balance (৳${currentBalance.toFixed(2)}) is insufficient for this withdrawal`
      );
      return;
    }

    if (!walletNumber.trim()) {
      toast.error("Please provide the recipient wallet/account number");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/payment/withdraws/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: withdrawAmount,
          walletName: paymentWallet,
          walletNumber: walletNumber.trim(),
          accountHolderName: accountHolderName.trim() || undefined,
          status,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Manual withdrawal processed successfully!");
        resetForm();
        onOpenChange(false);
        onSuccess?.(data);
      } else {
        toast.error(data.error || "Failed to process manual withdrawal");
      }
    } catch {
      toast.error("Network error while submitting manual withdrawal");
    } finally {
      setSubmitting(false);
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
      <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ArrowUpRight className="w-5 h-5 text-rose-400" />
            Manual User Withdrawal
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-400">
            Deduct player balance and create a registered manual withdrawal record.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* User Selection / Info */}
          {allowUserSearch && !selectedUser ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Search User</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  placeholder="Enter user phone number or player ID..."
                  className="bg-gray-950 border-gray-800 pl-9 text-xs"
                />
              </div>
              {searching && (
                <div className="text-[11px] text-gray-400">Searching...</div>
              )}
              {searchResults.length > 0 && (
                <div className="bg-gray-950 border border-gray-800 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-800">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUserFromSearch(u)}
                      className="p-2 text-xs flex justify-between items-center hover:bg-gray-800/60 cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {u.phone} ({u.playerId})
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {u.name || "Player"}
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                        ৳ {Number(u.wallet?.balance ?? 0).toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 flex justify-between items-center">
              <div>
                <div className="text-xs font-semibold text-white">
                  {selectedUser?.name || "Player"}
                </div>
                <div className="text-[11px] text-gray-400 font-mono">
                  {selectedUser?.phone || selectedUser?.playerId}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400">Current Balance</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  ৳ {currentBalance.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Amount input & quick chips */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-gray-300">Withdraw Amount (BDT)</Label>
              {isInsufficient && (
                <span className="text-[11px] text-rose-400 font-medium">
                  Exceeds balance!
                </span>
              )}
            </div>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <Input
                type="number"
                step="0.01"
                min="1"
                max={currentBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`bg-gray-950 pl-9 text-xs font-mono font-bold ${
                  isInsufficient
                    ? "border-rose-500 focus-visible:ring-rose-500 text-rose-300"
                    : "border-gray-800 text-white"
                }`}
              />
            </div>
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[200, 500, 1000, 2000, 5000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAmount(String(val))}
                  className="px-2 py-0.5 rounded bg-gray-850 hover:bg-gray-800 text-[10px] text-gray-300 border border-gray-700 font-mono"
                >
                  ৳{val}
                </button>
              ))}
              {currentBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(currentBalance))}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-[10px] text-amber-300 border border-amber-500/40 font-mono font-semibold"
                >
                  All (৳{currentBalance.toFixed(0)})
                </button>
              )}
            </div>
          </div>

          {/* Payment Method & Wallet Number */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Payment Method</Label>
              <Select value={paymentWallet} onValueChange={setPaymentWallet}>
                <SelectTrigger className="bg-gray-950 border-gray-800 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="bKash">bKash</SelectItem>
                  <SelectItem value="Nagad">Nagad</SelectItem>
                  <SelectItem value="Rocket">Rocket</SelectItem>
                  <SelectItem value="Upay">Upay</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash / Manual">Cash / Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Wallet / Acc Number</Label>
              <Input
                value={walletNumber}
                onChange={(e) => setWalletNumber(e.target.value)}
                placeholder="017xxxxxxxx"
                className="bg-gray-950 border-gray-800 text-xs font-mono"
              />
            </div>
          </div>

          {/* Account Holder Name & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Account Holder Name (Optional)</Label>
              <Input
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Name on account"
                className="bg-gray-950 border-gray-800 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Withdrawal Status</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as "APPROVED" | "PENDING")}
              >
                <SelectTrigger className="bg-gray-950 border-gray-800 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="APPROVED">APPROVED (Processed)</SelectItem>
                  <SelectItem value="PENDING">PENDING (Queued)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Note / TrxID */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-300">Admin Note / TrxID (Optional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid via bKash personal TrxID #..."
              className="bg-gray-950 border-gray-800 text-xs"
            />
          </div>

          {/* Live Balance Summary */}
          {withdrawAmount > 0 && !isInsufficient && (
            <div className="p-2.5 rounded-lg bg-gray-950 border border-gray-800/80 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-gray-400 text-[11px]">
                <span>Current Balance:</span>
                <span>৳ {currentBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-400 text-[11px]">
                <span>Withdraw Amount:</span>
                <span>- ৳ {withdrawAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-bold border-t border-gray-800 pt-1 text-xs">
                <span>Remaining Balance:</span>
                <span className="text-emerald-400">৳ {remainingBalance.toFixed(2)}</span>
              </div>
            </div>
          )}

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
              disabled={
                submitting ||
                !selectedUser ||
                withdrawAmount <= 0 ||
                isInsufficient ||
                !walletNumber.trim()
              }
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
            >
              {submitting ? "Processing..." : `Execute Withdrawal (৳${withdrawAmount || 0})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
