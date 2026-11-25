"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  FaGift,
  FaShieldAlt,
  FaCalendarCheck,
  FaSave,
  FaSpinner,
  FaCoins,
  FaLock,
  FaCheckCircle,
  FaMobileAlt,
} from "react-icons/fa";
import { MdOutlineSecurity, MdOutlineSavings } from "react-icons/md";
import { DEFAULT_BONUS_MISSION_CONFIG, BonusMissionConfig } from "@/app/api/admin/bonus-missions/route";

export default function BonusMissionsAdminPage() {
  const [config, setConfig] = useState<BonusMissionConfig>(DEFAULT_BONUS_MISSION_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/bonus-missions");
      const json = await res.json();
      if (json.success && json.config) {
        setConfig(json.config);
      }
    } catch (err: any) {
      toast.error("Failed to load bonus & mission settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/bonus-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Bonus & Mission Engine settings saved successfully!");
        if (json.config) setConfig(json.config);
      } else {
        toast.error(json.error || "Failed to save settings");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof BonusMissionConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <FaSpinner className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
            <FaGift className="text-emerald-400" /> Bonus & Mission Control Engine
          </h1>
          <p className="text-sm text-gray-400">
            Manage all platform bonuses, free rewards, and mission pages from one place. Enable, disable, or customize reward amounts anytime.
          </p>
        </div>
        <Button
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
              <FaSave className="mr-2 h-4 w-4" /> Save Settings
            </>
          )}
        </Button>
      </div>

      {/* 1. Master Page & Feature Controls */}
      <Card className="border-gray-800 bg-gray-900/80 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-emerald-400">
            <MdOutlineSecurity className="text-xl" /> Master Page & Feature Switches
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enable or completely disable specific bonus pages and promotional features across the website and mobile app.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {/* Mission Page Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/60 p-4">
            <div className="space-y-0.5">
              <Label className="font-semibold text-white">Mission Page (/mission)</Label>
              <p className="text-xs text-gray-400">
                When disabled, players cannot access or claim rewards from the Mission page
              </p>
            </div>
            <Switch
              checked={config.pageMissionsEnabled}
              onCheckedChange={(checked) => updateConfig("pageMissionsEnabled", checked)}
            />
          </div>

          {/* Reward Center Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/60 p-4">
            <div className="space-y-0.5">
              <Label className="font-semibold text-white">Reward Center (/rewardCenter)</Label>
              <p className="text-xs text-gray-400">
                When disabled, the daily check-in and reward center page is turned off
              </p>
            </div>
            <Switch
              checked={config.pageRewardCenterEnabled}
              onCheckedChange={(checked) => updateConfig("pageRewardCenterEnabled", checked)}
            />
          </div>

          {/* App Download Instant Bonus */}
          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/60 p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-1.5 font-semibold text-white">
                <FaMobileAlt className="text-blue-400" /> App Download ৳50 Instant Bonus
              </Label>
              <p className="text-xs text-gray-400">
                Toggle the instant ৳50 free bonus for logging in via the mobile app
              </p>
            </div>
            <Switch
              checked={config.bonusAppDownloadEnabled}
              onCheckedChange={(checked) => updateConfig("bonusAppDownloadEnabled", checked)}
            />
          </div>

          {/* Lucky Wheel Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/60 p-4">
            <div className="space-y-0.5">
              <Label className="font-semibold text-white">Lucky Wheel System</Label>
              <p className="text-xs text-gray-400">
                Enable or disable the daily Lucky Wheel spin feature for players
              </p>
            </div>
            <Switch
              checked={config.luckyWheelEnabled}
              onCheckedChange={(checked) => updateConfig("luckyWheelEnabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Security & Deposit Requirement for Claiming Bonuses */}
      <Card className="border-amber-900/40 bg-gray-900/80 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-amber-400">
            <FaLock className="text-lg" /> Anti-Fraud: Deposit Requirement for Bonuses
          </CardTitle>
          <CardDescription className="text-gray-400">
            Require players to have a verified real deposit before claiming free bonuses or mission rewards.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/60 p-4">
            <div className="space-y-0.5">
              <Label className="font-semibold text-white">
                Require Real Deposit Before Claiming
              </Label>
              <p className="text-xs text-gray-400">
                When enabled, users without an approved deposit cannot claim free bonuses or mission rewards
              </p>
            </div>
            <Switch
              checked={config.requireDepositToClaimBonus}
              onCheckedChange={(checked) => updateConfig("requireDepositToClaimBonus", checked)}
            />
          </div>

          <div className="space-y-2 rounded-lg border border-gray-800 bg-gray-950/60 p-4">
            <Label className="font-semibold text-white">
              Minimum Deposit Amount to Unlock Rewards (৳)
            </Label>
            <Input
              type="number"
              min={0}
              value={config.minDepositRequiredToClaim}
              onChange={(e) =>
                updateConfig("minDepositRequiredToClaim", Number(e.target.value) || 0)
              }
              className="border-gray-700 bg-gray-900 text-white"
            />
            <p className="text-xs text-gray-400">
              Minimum total approved deposit required on the player account to unlock reward claims
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Individual Mission Rewards Configuration */}
      <Card className="border-gray-800 bg-gray-900/80 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-emerald-400">
            <FaCoins className="text-lg" /> Mission Rewards Settings & Amounts
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure the reward amount and active status for each individual mission.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Daily Login Reward */}
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-gray-800 bg-gray-950/60 p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Daily Login Reward</span>
                {!config.dailyLoginEnabled && (
                  <span className="rounded bg-rose-950/60 px-2 py-0.5 text-[10px] font-medium text-rose-400">
                    DISABLED
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Free reward granted just for logging in. Keep disabled to prevent no-deposit free cash claims.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-28">
                <Label className="text-[10px] text-gray-400">Reward (৳)</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.dailyLoginReward}
                  onChange={(e) =>
                    updateConfig("dailyLoginReward", Number(e.target.value) || 0)
                  }
                  className="border-gray-700 bg-gray-900 text-white"
                />
              </div>
              <Switch
                checked={config.dailyLoginEnabled}
                onCheckedChange={(checked) => updateConfig("dailyLoginEnabled", checked)}
              />
            </div>
          </div>

          {/* Daily Deposit 500 Reward */}
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-gray-800 bg-gray-950/60 p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <span className="font-semibold text-white">Daily First Deposit (৳500+)</span>
              <p className="text-xs text-gray-400">
                Extra cashback bonus when a player deposits at least ৳500 in a day
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-28">
                <Label className="text-[10px] text-gray-400">Reward (৳)</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.dailyDeposit500Reward}
                  onChange={(e) =>
                    updateConfig("dailyDeposit500Reward", Number(e.target.value) || 0)
                  }
                  className="border-gray-700 bg-gray-900 text-white"
                />
              </div>
              <Switch
                checked={config.dailyDeposit500Enabled}
                onCheckedChange={(checked) => updateConfig("dailyDeposit500Enabled", checked)}
              />
            </div>
          </div>

          {/* First Ever Deposit Badge */}
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-gray-800 bg-gray-950/60 p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <span className="font-semibold text-white">First Depositor Badge (First Ever Deposit)</span>
              <p className="text-xs text-gray-400">
                One-time achievement reward for completing the first approved deposit
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-28">
                <Label className="text-[10px] text-gray-400">Reward (৳)</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.firstDepositBadgeReward}
                  onChange={(e) =>
                    updateConfig("firstDepositBadgeReward", Number(e.target.value) || 0)
                  }
                  className="border-gray-700 bg-gray-900 text-white"
                />
              </div>
              <Switch
                checked={config.firstDepositBadgeEnabled}
                onCheckedChange={(checked) =>
                  updateConfig("firstDepositBadgeEnabled", checked)
                }
              />
            </div>
          </div>

          {/* Daily Turnover Sprint */}
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-gray-800 bg-gray-950/60 p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <span className="font-semibold text-white">Turnover Sprint (৳1,000 Daily Bet)</span>
              <p className="text-xs text-gray-400">
                Reward for completing ৳1,000 in game betting turnover within a day
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-28">
                <Label className="text-[10px] text-gray-400">Reward (৳)</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.dailyTurnoverReward}
                  onChange={(e) =>
                    updateConfig("dailyTurnoverReward", Number(e.target.value) || 0)
                  }
                  className="border-gray-700 bg-gray-900 text-white"
                />
              </div>
              <Switch
                checked={config.dailyTurnoverEnabled}
                onCheckedChange={(checked) =>
                  updateConfig("dailyTurnoverEnabled", checked)
                }
              />
            </div>
          </div>

          {/* Weekly Deposit 5000 */}
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-gray-800 bg-gray-950/60 p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <span className="font-semibold text-white">Weekly Deposit Rush (৳5,000 Deposit)</span>
              <p className="text-xs text-gray-400">
                Weekly milestone reward for reaching ৳5,000 in total approved deposits
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-28">
                <Label className="text-[10px] text-gray-400">Reward (৳)</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.weeklyDeposit5000Reward}
                  onChange={(e) =>
                    updateConfig("weeklyDeposit5000Reward", Number(e.target.value) || 0)
                  }
                  className="border-gray-700 bg-gray-900 text-white"
                />
              </div>
              <Switch
                checked={config.weeklyDeposit5000Enabled}
                onCheckedChange={(checked) =>
                  updateConfig("weeklyDeposit5000Enabled", checked)
                }
              />
            </div>
          </div>

          {/* Weekly Invite 2 Friends */}
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-gray-800 bg-gray-950/60 p-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <span className="font-semibold text-white">Invite Champion (Invite 2 Friends)</span>
              <p className="text-xs text-gray-400">
                Reward for inviting 2 new players via referral link
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-28">
                <Label className="text-[10px] text-gray-400">Reward (৳)</Label>
                <Input
                  type="number"
                  min={0}
                  value={config.weeklyInviteReward}
                  onChange={(e) =>
                    updateConfig("weeklyInviteReward", Number(e.target.value) || 0)
                  }
                  className="border-gray-700 bg-gray-900 text-white"
                />
              </div>
              <Switch
                checked={config.weeklyInviteEnabled}
                onCheckedChange={(checked) =>
                  updateConfig("weeklyInviteEnabled", checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Daily Check-in / Calendar Rewards */}
      <Card className="border-gray-800 bg-gray-900/80 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-emerald-400">
                <FaCalendarCheck className="text-lg" /> Daily Check-in (7-Day Reward Calendar)
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure the daily check-in reward amounts from Day 1 through Day 7.
              </CardDescription>
            </div>
            <Switch
              checked={config.dailyCheckinEnabled}
              onCheckedChange={(checked) => updateConfig("dailyCheckinEnabled", checked)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const key = `dailyCheckinDay${day}` as keyof BonusMissionConfig;
              return (
                <div
                  key={day}
                  className="rounded-lg border border-gray-800 bg-gray-950/60 p-3 text-center"
                >
                  <span className="text-xs font-semibold text-gray-400">Day {day}</span>
                  <div className="mt-2">
                    <Input
                      type="number"
                      min={0}
                      value={config[key] as number}
                      onChange={(e) =>
                        updateConfig(key, Number(e.target.value) || 0)
                      }
                      className="border-gray-700 bg-gray-900 text-center font-bold text-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-emerald-600 px-8 font-semibold text-white hover:bg-emerald-500"
        >
          {saving ? (
            <>
              <FaSpinner className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...
            </>
          ) : (
            <>
              <FaSave className="mr-2 h-4 w-4" /> Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
