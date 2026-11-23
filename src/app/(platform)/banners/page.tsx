"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { Switch } from "@/components/ui/switch";
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
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  Eye,
  ImageIcon,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

interface BannerItem {
  id: string;
  imageUrl: string;
  title: string | null;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Multi-file upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add via URL dialog
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlImageUrl, setUrlImageUrl] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [urlLink, setUrlLink] = useState("");
  const [addingViaUrl, setAddingViaUrl] = useState(false);

  // Edit banner dialog
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);

  // Preview full image dialog
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Toggle action loading
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch all banners
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/banners?all=true");
      const data = await res.json();
      if (data?.banners) {
        setBanners(data.banners);
      }
    } catch {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Multi-file selection handler
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      const previews = files.map((file) => URL.createObjectURL(file));
      setFilePreviews(previews);
    }
  };

  // Upload multiple files directly to server
  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploadingFiles(true);
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/banners", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || "Banners uploaded successfully!");
        setSelectedFiles([]);
        setFilePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchBanners();
      } else {
        toast.error(data.error || "Failed to upload banners");
      }
    } catch {
      toast.error("Network error during file upload");
    } finally {
      setUploadingFiles(false);
    }
  };

  // Add banner via URL
  const handleAddViaUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlImageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    try {
      setAddingViaUrl(true);
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: urlImageUrl.trim(),
          title: urlTitle.trim() || undefined,
          linkUrl: urlLink.trim() || undefined,
          isActive: true,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Banner added successfully!");
        setUrlImageUrl("");
        setUrlTitle("");
        setUrlLink("");
        setIsUrlModalOpen(false);
        fetchBanners();
      } else {
        toast.error(data.error || "Failed to add banner");
      }
    } catch {
      toast.error("Network error adding banner");
    } finally {
      setAddingViaUrl(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (banner: BannerItem, nextActive: boolean) => {
    try {
      setTogglingId(banner.id);
      // Optimistic update
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, isActive: nextActive } : b))
      );

      const res = await fetch("/api/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: banner.id,
          isActive: nextActive,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          `Banner "${banner.title || "Image"}" is now ${
            nextActive ? "Active on Website" : "Hidden"
          }`
        );
      } else {
        // Revert on error
        setBanners((prev) =>
          prev.map((b) =>
            b.id === banner.id ? { ...b, isActive: !nextActive } : b
          )
        );
        toast.error(data.error || "Failed to update banner status");
      }
    } catch {
      toast.error("Error updating banner status");
    } finally {
      setTogglingId(null);
    }
  };

  // Change sort order
  const handleMoveOrder = async (banner: BannerItem, direction: "up" | "down") => {
    const newSortOrder =
      direction === "up"
        ? Math.max(1, banner.sortOrder - 1)
        : banner.sortOrder + 1;

    try {
      const res = await fetch("/api/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: banner.id,
          sortOrder: newSortOrder,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchBanners();
      }
    } catch {
      toast.error("Failed to reorder banner");
    }
  };

  // Edit banner metadata
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    try {
      setSavingEdit(true);
      const res = await fetch("/api/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBanner.id,
          title: editTitle,
          linkUrl: editLink,
          imageUrl: editImageUrl.trim() || editingBanner.imageUrl,
          sortOrder: editSortOrder,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Banner updated successfully!");
        setEditingBanner(null);
        fetchBanners();
      } else {
        toast.error(data.error || "Failed to update banner");
      }
    } catch {
      toast.error("Network error while updating banner");
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete banner
  const handleDeleteBanner = async (banner: BannerItem) => {
    if (
      !confirm(
        `Are you sure you want to delete this banner "${
          banner.title || "Image"
        }"?`
      )
    ) {
      return;
    }

    try {
      setDeletingId(banner.id);
      const res = await fetch(`/api/banners?id=${banner.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Banner deleted successfully!");
        setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      } else {
        toast.error(data.error || "Failed to delete banner");
      }
    } catch {
      toast.error("Error deleting banner");
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount = banners.filter((b) => b.isActive).length;
  const draftCount = banners.length - activeCount;

  return (
    <div className="space-y-6">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600/20 via-orange-600/10 to-purple-600/20 border border-amber-500/20 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-amber-500 text-black font-bold uppercase tracking-wider text-[11px] px-2 py-0.5">
                  Web & Mobile App
                </Badge>
                <Badge
                  variant="outline"
                  className="border-amber-500/30 text-amber-300 font-mono text-[11px]"
                >
                  <Sparkles className="w-3 h-3 mr-1" /> Auto-Synced to Player Slider
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <ImageIcon className="w-8 h-8 text-amber-400" />
                Website Banners & Sliders
              </h1>
              <p className="text-sm text-gray-300 mt-1.5 max-w-2xl leading-relaxed">
                Add, manage, activate or deactivate homepage slider banners. All
                banners remain saved on your server so you can toggle them active
                or remove them anytime.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <UploadCloud className="w-4 h-4 mr-1.5" /> Upload Images
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsUrlModalOpen(true)}
                className="border-gray-700 bg-gray-900/80 hover:bg-gray-800 text-white text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Image URL
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchBanners}
                className="text-gray-400 hover:text-white"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-gray-400">
                Total Saved Banners
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-white flex items-center justify-between">
                <span>{banners.length}</span>
                <ImageIcon className="w-5 h-5 text-gray-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-gray-500">
                Permanently preserved in database
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-gray-400">
                Currently Live on Website
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-400 flex items-center justify-between">
                <span>{activeCount}</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-emerald-500/80">
                Displaying to players in homepage carousel
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/90 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs text-gray-400">
                Hidden / Draft Banners
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-gray-400 flex items-center justify-between">
                <span>{draftCount}</span>
                <Eye className="w-5 h-5 text-gray-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-gray-500">
                Saved in admin, ready to activate anytime
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Hidden File Input for Multiple Uploads */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif"
          onChange={handleFilesSelected}
          className="hidden"
        />

        {/* Selected Files Preview & Confirmation Panel */}
        {selectedFiles.length > 0 && (
          <Card className="bg-gradient-to-b from-gray-900 to-gray-950 border-amber-500/40 shadow-xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  Ready to Upload {selectedFiles.length} Image(s)
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Review selected images before uploading to your server storage
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setFilePreviews([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="border-gray-700 text-xs text-gray-400 hover:text-white"
                >
                  Clear All
                </Button>
                <Button
                  size="sm"
                  onClick={handleUploadFiles}
                  disabled={uploadingFiles}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
                >
                  {uploadingFiles ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Uploading {selectedFiles.length} Images...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                      Upload All to Server
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {filePreviews.map((preview, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden border border-gray-800 bg-gray-950 aspect-video flex items-center justify-center"
                  >
                    <img
                      src={preview}
                      alt={`Upload ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                      <span className="text-[10px] text-white truncate max-w-full font-mono">
                        {selectedFiles[idx]?.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Banners List Header & View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">All Banners</h2>
            <Badge variant="outline" className="text-xs border-gray-700 text-gray-300">
              {banners.length} Total
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              onClick={() => setViewMode("grid")}
              className="h-7 px-2 text-xs"
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              onClick={() => setViewMode("table")}
              className="h-7 px-2 text-xs"
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {banners.map((b) => (
              <Card
                key={b.id}
                className={`bg-gray-900 border transition-all overflow-hidden ${
                  b.isActive
                    ? "border-emerald-500/40 shadow-lg shadow-emerald-950/20"
                    : "border-gray-800 opacity-80 hover:opacity-100"
                }`}
              >
                {/* Image Container with 16:9 Banner ratio */}
                <div className="relative aspect-[16/7] w-full bg-gray-950 overflow-hidden group">
                  <img
                    src={b.imageUrl}
                    alt={b.title || "Banner"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                    onClick={() => setPreviewImage(b.imageUrl)}
                  />

                  {/* Top Bar Badges on Image */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <Badge
                      className={`text-[10px] font-bold ${
                        b.isActive
                          ? "bg-emerald-500 text-black"
                          : "bg-gray-800/90 text-gray-300 border border-gray-700"
                      }`}
                    >
                      {b.isActive ? "ACTIVE" : "HIDDEN"}
                    </Badge>
                    <Badge className="bg-black/70 text-gray-300 border border-gray-700/60 font-mono text-[10px]">
                      #{b.sortOrder}
                    </Badge>
                  </div>

                  {/* View Full Click Overlay */}
                  <div
                    onClick={() => setPreviewImage(b.imageUrl)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <span className="px-3 py-1.5 rounded-full bg-black/70 text-white text-xs flex items-center gap-1.5 border border-white/20">
                      <Eye className="w-3.5 h-3.5" /> Click to View Full
                    </span>
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Title & Link */}
                  <div>
                    <h3 className="font-semibold text-white text-sm truncate" title={b.title || "Banner"}>
                      {b.title || "Untitled Banner"}
                    </h3>
                    {b.linkUrl ? (
                      <a
                        href={b.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 truncate mt-0.5"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{b.linkUrl}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-gray-500 italic">No click link</span>
                    )}
                  </div>

                  {/* Controls: Active Switch & Reordering */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={b.isActive}
                        disabled={togglingId === b.id}
                        onCheckedChange={(checked) => handleToggleActive(b, checked)}
                      />
                      <span
                        className={`text-xs font-semibold ${
                          b.isActive ? "text-emerald-400" : "text-gray-400"
                        }`}
                      >
                        {b.isActive ? "Live on Web" : "Hidden"}
                      </span>
                    </div>

                    {/* Order Controls */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveOrder(b, "up")}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveOrder(b, "down")}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800/60">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {moment(b.createdAt).format("DD MMM YYYY")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingBanner(b);
                          setEditTitle(b.title || "");
                          setEditLink(b.linkUrl || "");
                          setEditImageUrl(b.imageUrl);
                          setEditSortOrder(b.sortOrder);
                        }}
                        className="h-7 px-2 text-xs border-gray-700 text-gray-300 hover:text-white"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingId === b.id}
                        onClick={() => handleDeleteBanner(b)}
                        className="h-7 px-2 text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 bg-gray-950/60">
                    <TableHead className="w-[80px]">Order</TableHead>
                    <TableHead>Banner Preview</TableHead>
                    <TableHead>Title & Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((b) => (
                    <TableRow key={b.id} className="border-gray-800">
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            #{b.sortOrder}
                          </span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => handleMoveOrder(b, "up")}
                              className="text-gray-500 hover:text-white leading-none"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(b, "down")}
                              className="text-gray-500 hover:text-white leading-none"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="w-28 h-12 rounded-md overflow-hidden bg-gray-950 border border-gray-800 cursor-pointer hover:border-amber-400 transition-colors shrink-0"
                          onClick={() => setPreviewImage(b.imageUrl)}
                        >
                          <img
                            src={b.imageUrl}
                            alt={b.title || "Banner"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[180px]">
                          <div className="font-semibold text-white text-xs truncate">
                            {b.title || "Untitled Banner"}
                          </div>
                          {b.linkUrl ? (
                            <a
                              href={b.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-400 hover:underline truncate block"
                            >
                              {b.linkUrl}
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-500">
                              No click link
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={b.isActive}
                            disabled={togglingId === b.id}
                            onCheckedChange={(checked) =>
                              handleToggleActive(b, checked)
                            }
                          />
                          <Badge
                            className={`text-[10px] font-bold ${
                              b.isActive
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-gray-800 text-gray-400"
                            }`}
                          >
                            {b.isActive ? "Active" : "Hidden"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400 font-mono">
                        {moment(b.createdAt).format("DD MMM YYYY")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingBanner(b);
                              setEditTitle(b.title || "");
                              setEditLink(b.linkUrl || "");
                              setEditImageUrl(b.imageUrl);
                              setEditSortOrder(b.sortOrder);
                            }}
                            className="h-7 px-2 text-xs border-gray-700"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deletingId === b.id}
                            onClick={() => handleDeleteBanner(b)}
                            className="h-7 px-2 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {banners.length === 0 && !loading && (
          <Card className="bg-gray-900 border-gray-800 py-12 text-center">
            <CardContent className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto text-amber-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No Banners Added Yet</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Upload multiple banner images or paste image links to display in
                the website homepage slider carousel.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
                >
                  <UploadCloud className="w-4 h-4 mr-1.5" /> Upload Image Files
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsUrlModalOpen(true)}
                  className="border-gray-700 text-white text-xs"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Image URL
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Via URL Dialog */}
      <Dialog open={isUrlModalOpen} onOpenChange={setIsUrlModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              Add Banner via Image URL
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Provide an external or hosted image URL to add to the banner carousel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddViaUrl} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Banner Image URL *</Label>
              <Input
                value={urlImageUrl}
                onChange={(e) => setUrlImageUrl(e.target.value)}
                placeholder="https://... or /uploads/..."
                className="bg-gray-950 border-gray-800 text-xs font-mono"
                required
              />
            </div>

            {urlImageUrl && (
              <div className="rounded-lg overflow-hidden border border-gray-800 bg-gray-950 aspect-[16/7]">
                <img
                  src={urlImageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/800x350/1a1a1a/cccccc?text=Invalid+Image+URL";
                  }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Banner Title (Optional)</Label>
              <Input
                value={urlTitle}
                onChange={(e) => setUrlTitle(e.target.value)}
                placeholder="e.g. 100% First Deposit Bonus"
                className="bg-gray-950 border-gray-800 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Target Link URL (Optional)</Label>
              <Input
                value={urlLink}
                onChange={(e) => setUrlLink(e.target.value)}
                placeholder="e.g. /promotions or https://..."
                className="bg-gray-950 border-gray-800 text-xs font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUrlModalOpen(false)}
                className="border-gray-700 bg-gray-800 text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addingViaUrl || !urlImageUrl.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
              >
                {addingViaUrl ? "Adding..." : "Add Banner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Banner Dialog */}
      <Dialog
        open={Boolean(editingBanner)}
        onOpenChange={(val) => !val && setEditingBanner(null)}
      >
        <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-400" />
              Edit Banner
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Update title, target link, sort order or replace image URL.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="rounded-lg overflow-hidden border border-gray-800 bg-gray-950 aspect-[16/7]">
              <img
                src={editImageUrl || editingBanner?.imageUrl}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Image URL</Label>
              <Input
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                placeholder="https://..."
                className="bg-gray-950 border-gray-800 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-gray-300">Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Banner title"
                className="bg-gray-950 border-gray-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300">Target Link URL</Label>
                <Input
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  placeholder="/promotions"
                  className="bg-gray-950 border-gray-800 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-300">Sort Order</Label>
                <Input
                  type="number"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(Number(e.target.value))}
                  className="bg-gray-950 border-gray-800 text-xs font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingBanner(null)}
                className="border-gray-700 bg-gray-800 text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEdit}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Full Preview Image Dialog */}
      <Dialog
        open={Boolean(previewImage)}
        onOpenChange={(val) => !val && setPreviewImage(null)}
      >
        <DialogContent className="bg-black/95 border-gray-800 text-white sm:max-w-[800px] p-2">
          {previewImage && (
            <div className="rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={previewImage}
                alt="Banner full view"
                className="max-h-[80vh] w-auto object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
