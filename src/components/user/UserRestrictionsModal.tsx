"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  FaGamepad,
  FaMoneyBillWave,
  FaHandHoldingUsd,
  FaGift,
  FaUserSlash,
  FaSpinner,
  FaSave,
  FaShieldAlt,
} from "react-icons/fa";

interface UserRestrictionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    playerId: string;
    phone: string;
    canDeposit?: boolean;
    canWithdraw?: boolean;
    canPlayGame?: boolean;
    canClaimBonus?: boolean;
    isBanned?: boolean;
  };
  onUpdated: () => void;
}

export function UserRestrictionsModal({
  isOpen,
  onClose,
  user,
  onUpdated,
}: UserRestrictionsModalProps) {
  const [canDeposit, setCanDeposit] = useState<boolean>(user.canDeposit ?? true);
  const [canWithdraw, setCanWithdraw] = useState<boolean>(user.canWithdraw ?? true);
  const [canPlayGame, setCanPlayGame] = useState<boolean>(user.canPlayGame ?? true);
  const [canClaimBonus, setCanClaimBonus] = useState<boolean>(user.canClaimBonus ?? true);
  const [isBanned, setIsBanned] = useState<boolean>(user.isBanned ?? false);
  const [saving, setSaving] = useState(false);

  // Sync state when modal opens or user updates
  React.useEffect(() => {
    setCanDeposit(user.canDeposit ?? true);
    setCanWithdraw(user.canWithdraw ?? true);
    setCanPlayGame(user.canPlayGame ?? true);
    setCanClaimBonus(user.canClaimBonus ?? true);
    setIsBanned(user.isBanned ?? false);
  }, [user, isOpen]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/users/${user.id}/restrictions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canDeposit,
          canWithdraw,
          canPlayGame,
          canClaimBonus,
          isBanned,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Restrictions updated for Player ${user.playerId}!`);
        onUpdated();
        onClose();
      } else {
        toast.error(data.error || "Failed to update restrictions");
      }
    } catch {
      toast.error("Network error while updating restrictions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg border-gray-800 bg-[#111827] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-emerald-400">
            <FaShieldAlt className="text-xl" /> User Permissions & Restrictions
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            Manage granular account privileges for Player{" "}
            <span className="font-semibold text-white">{user.playerId}</span> ({user.phone}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* 1. Game Play Control */}
          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${canPlayGame ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                <FaGamepad className="text-lg" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-white">
                  Allow Game Play (Slots, Aviator, Live)
                </Label>
                <p className="text-xs text-gray-400">
                  {canPlayGame
                    ? "Player can launch and play all casino games"
                    : "🚫 Game play blocked for this player"}
                </p>
              </div>
            </div>
            <Switch
              checked={canPlayGame}
              onCheckedChange={setCanPlayGame}
            />
          </div>

          {/* 2. Deposit Control */}
          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${canDeposit ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                <FaMoneyBillWave className="text-lg" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-white">
                  Allow Deposits
                </Label>
                <p className="text-xs text-gray-400">
                  {canDeposit
                    ? "Player can submit deposit requests"
                    : "🚫 Deposit requests blocked for this player"}
                </p>
              </div>
            </div>
            <Switch
              checked={canDeposit}
              onCheckedChange={setCanDeposit}
            />
          </div>

          {/* 3. Withdrawal Control */}
          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${canWithdraw ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                <FaHandHoldingUsd className="text-lg" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-white">
                  Allow Withdrawals
                </Label>
                <p className="text-xs text-gray-400">
                  {canWithdraw
                    ? "Player can submit withdrawals"
                    : "🚫 Withdrawals blocked for this player"}
                </p>
              </div>
            </div>
            <Switch
              checked={canWithdraw}
              onCheckedChange={setCanWithdraw}
            />
          </div>

          {/* 4. Bonus & Mission Rewards Control */}
          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/60 p-3.5">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${canClaimBonus ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                <FaGift className="text-lg" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-white">
                  Allow Bonus & Mission Rewards
                </Label>
                <p className="text-xs text-gray-400">
                  {canClaimBonus
                    ? "Player can claim daily & mission rewards"
                    : "🚫 Free bonuses blocked for this player"}
                </p>
              </div>
            </div>
            <Switch
              checked={canClaimBonus}
              onCheckedChange={setCanClaimBonus}
            />
          </div>

          {/* 5. Full Ban Status */}
          <div className="flex items-center justify-between rounded-lg border border-rose-900/40 bg-rose-950/20 p-3.5">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${isBanned ? "bg-rose-500/20 text-rose-400" : "bg-gray-800 text-gray-400"}`}>
                <FaUserSlash className="text-lg" />
              </div>
              <div>
                <Label className="text-sm font-semibold text-rose-300">
                  Account Banned
                </Label>
                <p className="text-xs text-gray-400">
                  {isBanned ? "⚠️ Full account is currently suspended" : "Account is active"}
                </p>
              </div>
            </div>
            <Switch
              checked={isBanned}
              onCheckedChange={setIsBanned}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 font-semibold text-white hover:bg-emerald-500"
          >
            {saving ? (
              <>
                <FaSpinner className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2 h-4 w-4" /> Save Restrictions
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
