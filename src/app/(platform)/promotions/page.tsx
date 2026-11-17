"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  FaGift,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaUser,
  FaUsers,
  FaGlobe,
  FaCheck,
  FaTimes,
  FaSave,
  FaDice,
  FaHistory,
} from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { MdOutlineLocalOffer, MdCelebration } from "react-icons/md";
import { RiTrophyLine } from "react-icons/ri";

const PRESET_IMAGES = [
  { label: "Welcome Match 1", url: "/promotion/promotion-1.jpg" },
  { label: "Top-Up Reload 2", url: "/promotion/promotion-2.jpeg" },
  { label: "Free Bonus 3", url: "/promotion/promotion-3.jpeg" },
  { label: "Slots 300% Booster", url: "/promotion/promotion-4.jpeg" },
  { label: "Weekly 1100% Reload", url: "/promotion/promotion-5.jpeg" },
  { label: "Slots 25% Daily", url: "/promotion/promotion-6.jpeg" },
  { label: "Slots 12% Cashback", url: "/promotion/promotion-7.jpeg" },
  { label: "Refer & Earn 600 BDT", url: "/promotion/promotion-8.jpeg" },
  { label: "Cricket & Sports Match", url: "/sports/sports-1.png" },
  { label: "Live Dealer 50%", url: "/sports/sports-2.png" },
  { label: "bKash & Nagad Booster", url: "/slider/slider-3.png" },
  { label: "Aviator Flight Insurance", url: "/slider/slider-4.png" },
  { label: "VIP Level-Up Prize", url: "/slider/slider-1.jpg" },
];

const CATEGORIES = [
  { id: "all", label: "All Offers" },
  { id: "welcome", label: "Welcome Bonus" },
  { id: "sports", label: "Sports & Cricket" },
  { id: "slots", label: "Slots & Crash" },
  { id: "live", label: "Live Casino" },
  { id: "reload", label: "Deposit Reload" },
  { id: "cashback", label: "Cashback" },
  { id: "referral", label: "Refer & Earn" },
];

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState<"promotions" | "wheel">("promotions");
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    context: "Special Bonus",
    category: "welcome",
    badge: "100% BONUS",
    badgeColor: "bg-gradient-to-r from-amber-500 to-yellow-500 text-black",
    turnover: "1x Turnover",
    minDeposit: "500 BDT",
    description: "",
    content: `## 🎁 How to Claim This Bonus in 3 Easy Steps\n\n### Step 1:\nGo to RK444 Cashier Deposit.\n\n### Step 2:\nSelect this exclusive promotion.\n\n### Step 3:\nComplete minimum qualifying deposit and enjoy fair 1x turnover rules!\n\n---\n\n## 📜 Promotion Rules & Terms\n- 🔁 Wagering Requirement: 1x Turnover before withdrawal.\n- 💸 Minimum deposit applies.`,
    image: "/promotion/promotion-1.jpg",
    targetType: "ALL", // "ALL" or "SPECIFIC"
    targetUserIds: [] as string[],
    isActive: true,
    sortOrder: 0,
  });

  // User search for targeted promotion
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Lucky Wheel state
  const [wheelSetting, setWheelSetting] = useState<any>(null);
  const [recentSpins, setRecentSpins] = useState<any[]>([]);
  const [savingWheel, setSavingWheel] = useState(false);

  // Fetch promotions
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/promotions");
      if (res.ok) {
        const data = await res.json();
        setPromotions(data.promotions || []);
      }
    } catch (e) {
      console.error("Error fetching promotions:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Lucky Wheel
  const fetchLuckyWheel = async () => {
    try {
      const res = await fetch("/api/lucky-wheel");
      if (res.ok) {
        const data = await res.json();
        setWheelSetting(data.setting);
        setRecentSpins(data.recentSpins || []);
      }
    } catch (e) {
      console.error("Error fetching lucky wheel:", e);
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchLuckyWheel();
  }, []);

  // Search users debounce
  useEffect(() => {
    if (!userSearch.trim()) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(userSearch)}`);
        if (res.ok) {
          const data = await res.json();
          setUserResults(data.users || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData({
      title: "",
      context: "Special Bonus",
      category: "welcome",
      badge: "100% BONUS",
      badgeColor: "bg-gradient-to-r from-amber-500 to-yellow-500 text-black",
      turnover: "1x Turnover",
      minDeposit: "500 BDT",
      description: "",
      content: `## 🎁 How to Claim This Bonus in 3 Easy Steps\n\n### Step 1:\nGo to RK444 Cashier Deposit.\n\n### Step 2:\nSelect this exclusive promotion.\n\n### Step 3:\nComplete minimum qualifying deposit and enjoy fair 1x turnover rules!\n\n---\n\n## 📜 Promotion Rules & Terms\n- 🔁 Wagering Requirement: 1x Turnover before withdrawal.\n- 💸 Minimum deposit applies.`,
      image: "/promotion/promotion-1.jpg",
      targetType: "ALL",
      targetUserIds: [],
      isActive: true,
      sortOrder: promotions.length + 1,
    });
    setSelectedUsers([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo: any) => {
    setEditingPromo(promo);
    setFormData({
      title: promo.title,
      context: promo.context,
      category: promo.category,
      badge: promo.badge || "",
      badgeColor: promo.badgeColor || "bg-gradient-to-r from-amber-500 to-yellow-500 text-black",
      turnover: promo.turnover || "1x Turnover",
      minDeposit: promo.minDeposit || "500 BDT",
      description: promo.description,
      content: promo.content,
      image: promo.image,
      targetType: promo.targetType || "ALL",
      targetUserIds: promo.targetUserIds || [],
      isActive: promo.isActive !== false,
      sortOrder: promo.sortOrder || 0,
    });
    setSelectedUsers(promo.targetUsers || []);
    setIsModalOpen(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        targetUserIds: formData.targetType === "SPECIFIC" ? selectedUsers.map((u) => u.id) : [],
      };

      if (editingPromo) {
        const res = await fetch(`/api/promotions/${editingPromo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update promotion");
      } else {
        const res = await fetch("/api/promotions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create promotion");
      }

      setIsModalOpen(false);
      fetchPromotions();
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;
    try {
      const res = await fetch(`/api/promotions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPromotions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (promo: any) => {
    try {
      await fetch(`/api/promotions/${promo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      setPromotions((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, isActive: !p.isActive } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTargetUser = (user: any) => {
    if (!selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearch("");
    setUserResults([]);
  };

  const handleRemoveTargetUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  // Lucky Wheel Slices Save
  const handleSaveWheel = async () => {
    try {
      setSavingWheel(true);
      const res = await fetch("/api/lucky-wheel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wheelSetting),
      });
      if (res.ok) {
        alert("Lucky Wheel settings saved successfully!");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save wheel");
    } finally {
      setSavingWheel(false);
    }
  };

  const handleSliceChange = (index: number, field: string, value: any) => {
    const updatedSlices = [...(wheelSetting?.slices || [])];
    updatedSlices[index] = { ...updatedSlices[index], [field]: value };
    setWheelSetting({ ...wheelSetting, slices: updatedSlices });
  };

  // Filtered promotions
  const filteredList = promotions.filter((p) => {
    const matchesCat = filterCategory === "all" || p.category === filterCategory;
    const matchesSearch =
      !searchQuery ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.context?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs font-black uppercase tracking-wider mb-1">
            <HiSparkles />
            <span>Promotion & Bonus Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Promotions & Lucky Wheel
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configure casino offers for all players or targeted users, and set up the interactive Lucky Wheel.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-card rounded-xl border border-border">
          <button
            onClick={() => setActiveTab("promotions")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "promotions"
                ? "bg-blue-600 text-white shadow-md"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <FaGift />
            <span>Promotion Offers ({promotions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("wheel")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "wheel"
                ? "bg-amber-500 text-black shadow-md font-black"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <FaDice />
            <span>Lucky Wheel</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: PROMOTIONS MANAGEMENT                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "promotions" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-3 text-muted-foreground text-xs" />
                <input
                  type="text"
                  placeholder="Search promotions by title or badge..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-card border border-border rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-card border border-border rounded-xl text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <FaPlus />
              <span>Create New Promotion</span>
            </button>
          </div>

          {/* Promotions Table */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-black tracking-wider">
                  <tr>
                    <th className="p-3">Offer & Banner</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Turnover / Min</th>
                    <th className="p-3">Target Audience</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Loading promotions...
                      </td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No promotions found. Click "+ Create New Promotion" to add one!
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((promo) => (
                      <tr key={promo.id} className="hover:bg-muted/30 transition-colors">
                        {/* Offer & Banner */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-black/40 border border-border flex-shrink-0">
                              <Image
                                src={promo.image || "/promotion/promotion-1.jpg"}
                                alt={promo.title}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 max-w-xs sm:max-w-md">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-white truncate block">
                                  {promo.title}
                                </span>
                                {promo.badge && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                                    {promo.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {promo.context} · {promo.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {promo.category}
                          </span>
                        </td>

                        {/* Specs */}
                        <td className="p-3">
                          <div className="space-y-0.5 text-[11px]">
                            <div className="text-emerald-400 font-bold">
                              {promo.turnover || "1x Turnover"}
                            </div>
                            <div className="text-muted-foreground text-[10px]">
                              Min: {promo.minDeposit || "500 BDT"}
                            </div>
                          </div>
                        </td>

                        {/* Target Audience */}
                        <td className="p-3">
                          {promo.targetType === "SPECIFIC" ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                <FaUsers size={9} />
                                <span>
                                  {promo.targetUserIds?.length || 0} Targeted Players
                                </span>
                              </span>
                              {promo.targetUsers && promo.targetUsers.length > 0 && (
                                <div className="text-[10px] text-muted-foreground flex flex-wrap gap-1">
                                  {promo.targetUsers.slice(0, 3).map((u: any) => (
                                    <span key={u.id} className="bg-card px-1 rounded border border-border">
                                      {u.phone || u.playerId}
                                    </span>
                                  ))}
                                  {promo.targetUsers.length > 3 && (
                                    <span>+{promo.targetUsers.length - 3} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <FaGlobe size={9} />
                              <span>All Players (Global)</span>
                            </span>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleToggleActive(promo)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all ${
                              promo.isActive
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-red-500/20 text-red-300 border border-red-500/40"
                            }`}
                          >
                            {promo.isActive ? "Active ✓" : "Inactive ✗"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(promo)}
                              className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition-all"
                              title="Edit Promotion"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeletePromo(promo.id)}
                              className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-all"
                              title="Delete Promotion"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: LUCKY WHEEL SETTINGS                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "wheel" && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-card border border-border p-5 sm:p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="text-yellow-400">🎡</span>
                  <span>Lucky Wheel Configuration</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Players can spin the lucky wheel on the promotion page to win real cash, match bonuses, and free spins.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                  <span>Wheel Status:</span>
                  <input
                    type="checkbox"
                    checked={wheelSetting?.isActive !== false}
                    onChange={(e) =>
                      setWheelSetting({ ...wheelSetting, isActive: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                  <span className={wheelSetting?.isActive !== false ? "text-emerald-400" : "text-red-400"}>
                    {wheelSetting?.isActive !== false ? "Enabled" : "Disabled"}
                  </span>
                </label>

                <button
                  onClick={handleSaveWheel}
                  disabled={savingWheel}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  <FaSave />
                  <span>{savingWheel ? "Saving..." : "Save Wheel Config"}</span>
                </button>
              </div>
            </div>

            {/* General Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Daily Free Spins Per Player
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={wheelSetting?.freeSpinsPerDay || 1}
                  onChange={(e) =>
                    setWheelSetting({
                      ...wheelSetting,
                      freeSpinsPerDay: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-white focus:outline-none focus:border-yellow-500"
                />
                <span className="text-[10px] text-muted-foreground">
                  Number of free spins granted to each player every 24 hours.
                </span>
              </div>
            </div>

            {/* Slices Configuration Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Wheel Slices & Prizes (8 Wedges)
              </h4>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-[10px] text-muted-foreground uppercase font-black">
                    <tr>
                      <th className="p-2.5">Slice #</th>
                      <th className="p-2.5">Prize Label</th>
                      <th className="p-2.5">Value (BDT/Count)</th>
                      <th className="p-2.5">Prize Type</th>
                      <th className="p-2.5">Slice Color</th>
                      <th className="p-2.5">Probability %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(wheelSetting?.slices || []).map((slice: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="p-2.5 font-bold text-white">#{idx + 1}</td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={slice.label}
                            onChange={(e) => handleSliceChange(idx, "label", e.target.value)}
                            className="px-2 py-1 text-xs bg-background border border-border rounded-lg text-white w-36"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={slice.value}
                            onChange={(e) =>
                              handleSliceChange(idx, "value", parseFloat(e.target.value) || 0)
                            }
                            className="px-2 py-1 text-xs bg-background border border-border rounded-lg text-white w-24"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={slice.type}
                            onChange={(e) => handleSliceChange(idx, "type", e.target.value)}
                            className="px-2 py-1 text-xs bg-background border border-border rounded-lg text-white cursor-pointer"
                          >
                            <option value="CASH">CASH (Direct Wallet Credit)</option>
                            <option value="RESPIN">RESPIN (Free Spin Again)</option>
                            <option value="BLAST">BLAST (Bomb / No Win)</option>
                            <option value="BONUS">BONUS (Deposit Match)</option>
                            <option value="FREE_SPINS">FREE_SPINS (Game Spins)</option>
                            <option value="TRY_AGAIN">TRY_AGAIN (No Prize)</option>
                          </select>
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={slice.color || "#F59E0B"}
                              onChange={(e) => handleSliceChange(idx, "color", e.target.value)}
                              className="w-7 h-7 rounded border border-border cursor-pointer bg-transparent"
                            />
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {slice.color}
                            </span>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={slice.probability}
                            onChange={(e) =>
                              handleSliceChange(idx, "probability", parseInt(e.target.value) || 1)
                            }
                            className="px-2 py-1 text-xs bg-background border border-border rounded-lg text-white w-16"
                          />
                          <span className="ml-1 text-[10px] text-muted-foreground">%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Spin History Table */}
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <FaHistory className="text-blue-400" />
              <span>Recent Player Spin History (Latest 25)</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-[10px] text-muted-foreground uppercase font-black">
                  <tr>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Player Phone</th>
                    <th className="p-2.5">Player ID</th>
                    <th className="p-2.5">Prize Won</th>
                    <th className="p-2.5">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentSpins.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No spin records yet. Spins will appear here in real-time!
                      </td>
                    </tr>
                  ) : (
                    recentSpins.map((spin: any) => (
                      <tr key={spin.id} className="hover:bg-muted/20">
                        <td className="p-2.5 text-muted-foreground">
                          {new Date(spin.createdAt).toLocaleString()}
                        </td>
                        <td className="p-2.5 font-bold text-white">
                          {spin.user?.phone || "Unknown"}
                        </td>
                        <td className="p-2.5 text-blue-400 font-mono">
                          {spin.user?.playerId || "-"}
                        </td>
                        <td className="p-2.5 font-black text-yellow-400">
                          {spin.prizeLabel}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted border border-border">
                            {spin.prizeType}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CREATE / EDIT PROMOTION MODAL                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-muted/40">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FaGift className="text-yellow-400" />
                <span>{editingPromo ? "Edit Promotion Offer" : "Create New Promotion Offer"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSavePromo} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Title & Context */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    Promotion Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Welcome Bonus 500 BDT"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    Context / Subheading
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Welcome Offer / VIP Booster"
                    value={formData.context}
                    onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    Highlight Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100% BONUS"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    Turnover Requirement
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1x Turnover"
                    value={formData.turnover}
                    onChange={(e) => setFormData({ ...formData, turnover: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Min Deposit & Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    Minimum Deposit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500 BDT or Any Amount"
                    value={formData.minDeposit}
                    onChange={(e) => setFormData({ ...formData, minDeposit: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    Banner Preset / Image Path
                  </label>
                  <select
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {PRESET_IMAGES.map((img) => (
                      <option key={img.url} value={img.url}>
                        {img.label} ({img.url})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-muted-foreground font-bold uppercase tracking-wider mb-1">
                  Card Summary Description *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Short card teaser description for players..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Content / Markdown Rules */}
              <div>
                <label className="block text-muted-foreground font-bold uppercase tracking-wider mb-1">
                  Full Steps & Promotion Rules (Markdown)
                </label>
                <textarea
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* ── TARGET AUDIENCE SECTION ─────────────────────────────────── */}
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-xs flex items-center gap-2">
                    <FaUsers className="text-blue-400" />
                    <span>Target Audience Setting</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="targetType"
                        value="ALL"
                        checked={formData.targetType === "ALL"}
                        onChange={() => setFormData({ ...formData, targetType: "ALL" })}
                        className="accent-blue-500"
                      />
                      <span className="text-white font-bold">All Players (Global)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="targetType"
                        value="SPECIFIC"
                        checked={formData.targetType === "SPECIFIC"}
                        onChange={() => setFormData({ ...formData, targetType: "SPECIFIC" })}
                        className="accent-purple-500"
                      />
                      <span className="text-purple-400 font-bold">Specific Players</span>
                    </label>
                  </div>
                </div>

                {/* Specific Player Selector */}
                {formData.targetType === "SPECIFIC" && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <label className="block text-[11px] text-muted-foreground font-bold">
                      Search and Select Players (by Phone, Player ID, or Name):
                    </label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-2.5 text-muted-foreground text-xs" />
                      <input
                        type="text"
                        placeholder="Type phone or player ID..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                      />

                      {/* Search Results Dropdown */}
                      {userResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-xl z-20 divide-y divide-border">
                          {userResults.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => handleAddTargetUser(u)}
                              className="w-full p-2.5 text-left hover:bg-muted/50 flex items-center justify-between text-xs transition-colors"
                            >
                              <div>
                                <span className="font-bold text-white">{u.phone}</span>
                                <span className="text-muted-foreground ml-2">ID: {u.playerId}</span>
                              </div>
                              <span className="text-[10px] text-purple-400 font-bold">+ Select</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Users Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedUsers.length === 0 ? (
                        <span className="text-[11px] text-yellow-400">
                          ⚠️ No players selected yet. Search above to add specific players.
                        </span>
                      ) : (
                        selectedUsers.map((u) => (
                          <span
                            key={u.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold"
                          >
                            <span>{u.phone || u.playerId}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTargetUser(u.id)}
                              className="hover:text-red-400 ml-1"
                            >
                              <FaTimes size={10} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status and Sort Order */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 font-bold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                  <span>Active & Visible to Players</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Sort Order:</span>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                    }
                    className="w-16 px-2 py-1 bg-background border border-border rounded-lg text-white text-center"
                  />
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-white rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <FaSave />
                  <span>{editingPromo ? "Save Changes" : "Create Promotion"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
