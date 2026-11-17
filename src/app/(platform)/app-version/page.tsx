"use client";

import React, { useState, useEffect } from "react";
import {
  FaMobileAlt,
  FaDownload,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSave,
  FaRocket,
  FaShieldAlt,
  FaListUl,
} from "react-icons/fa";

interface AppVersionConfig {
  latestVersion: string;
  versionCode: number;
  minVersion: string;
  forceUpdate: boolean;
  downloadUrl: string;
  releaseNotes: string;
}

export default function AppVersionPage() {
  const [config, setConfig] = useState<AppVersionConfig>({
    latestVersion: "1.0.0",
    versionCode: 1,
    minVersion: "1.0.0",
    forceUpdate: false,
    downloadUrl: "https://rk444.site/app.apk",
    releaseNotes: "• New 24H Lucky Wheel\n• Improved deposit & withdrawal speeds\n• Bug fixes and UI enhancements",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/app-version");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setConfig({
            latestVersion: data.latestVersion || "1.0.0",
            versionCode: data.versionCode || 1,
            minVersion: data.minVersion || "1.0.0",
            forceUpdate: Boolean(data.forceUpdate),
            downloadUrl: data.downloadUrl || "https://rk444.site/app.apk",
            releaseNotes: data.releaseNotes || "",
          });
        }
      }
    } catch (err: any) {
      setErrorMessage("Failed to load app version settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/app-version", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccessMessage("✅ App update configuration published successfully! All active mobile apps will detect this update.");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update version configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-lg">
              <FaMobileAlt />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Mobile App Auto-Update Manager
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            ম্যানেজ করুন অ্যান্ড্রয়েড মোবাইল অ্যাপের নতুন ভার্সন, APK ডাউনলোড লিংক এবং বাধ্যতামূলক অটো-আপডেট সেটিংস।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <FaCheckCircle />
            <span>Active Version: v{config.latestVersion}</span>
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <FaCheckCircle className="text-base flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
          <FaExclamationTriangle className="text-base flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Version Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSave}
            className="p-5 sm:p-6 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-5 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <FaRocket className="text-yellow-400" />
                <span>Publish New App Version</span>
              </h2>
              <span className="text-[11px] text-gray-400 font-medium">
                Changes apply instantly on mobile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Latest Version */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Latest Version Name (যেমন: 1.0.1, 1.1.0) *
                </label>
                <input
                  type="text"
                  required
                  value={config.latestVersion}
                  onChange={(e) => setConfig({ ...config, latestVersion: e.target.value })}
                  placeholder="e.g. 1.0.1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-gray-700 text-white text-xs font-semibold focus:border-blue-500 outline-none"
                />
              </div>

              {/* Version Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Version Code (Integer: 1, 2, 3...) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={config.versionCode}
                  onChange={(e) => setConfig({ ...config, versionCode: Number(e.target.value) || 1 })}
                  placeholder="e.g. 2"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-gray-700 text-white text-xs font-semibold focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Minimum Version */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Minimum Supported Version
                </label>
                <input
                  type="text"
                  value={config.minVersion}
                  onChange={(e) => setConfig({ ...config, minVersion: e.target.value })}
                  placeholder="e.g. 1.0.0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-gray-700 text-white text-xs font-semibold focus:border-blue-500 outline-none"
                />
              </div>

              {/* Force Update Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                  <span>Force Update (বাধ্যতামূলক আপডেট)</span>
                  <span className={config.forceUpdate ? "text-red-400 font-bold" : "text-gray-400"}>
                    {config.forceUpdate ? "MANDATORY" : "OPTIONAL"}
                  </span>
                </label>
                <div
                  onClick={() => setConfig({ ...config, forceUpdate: !config.forceUpdate })}
                  className={`w-full p-2.5 rounded-xl border cursor-pointer flex items-center justify-between select-none transition-all ${
                    config.forceUpdate
                      ? "bg-red-500/10 border-red-500/40 text-red-300"
                      : "bg-[#1e293b] border-gray-700 text-gray-400"
                  }`}
                >
                  <span className="text-xs font-bold">
                    {config.forceUpdate
                      ? "🔒 Force Update ON (আপডেট ছাড়া অ্যাপ ওপেন হবে না)"
                      : "🔓 Optional (ইউজার পরে আপডেট করতে পারবে)"}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.forceUpdate}
                    onChange={() => {}}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Direct APK Download URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">
                Direct APK Download Link *
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={config.downloadUrl}
                  onChange={(e) => setConfig({ ...config, downloadUrl: e.target.value })}
                  placeholder="https://rk444.site/app.apk"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#1e293b] border border-gray-700 text-white text-xs font-semibold focus:border-blue-500 outline-none"
                />
                <span className="absolute left-3 top-3 text-gray-400 text-xs">
                  <FaDownload />
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                ইউজার যখন অ্যাপে &quot;Update Now&quot; চাপবে, তখন এই লিংকের APK টি সরাসরি ডাউনলোড ও ইনস্টল শুরু হবে।
              </p>
            </div>

            {/* Release Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">
                Release Notes / What&apos;s New (ইউজার অ্যাপে যা দেখতে পাবে)
              </label>
              <textarea
                rows={4}
                value={config.releaseNotes}
                onChange={(e) => setConfig({ ...config, releaseNotes: e.target.value })}
                placeholder="• 24H Lucky Wheel added&#10;• New dynamic bonuses&#10;• Faster crash & slots load times"
                className="w-full p-3 rounded-xl bg-[#1e293b] border border-gray-700 text-white text-xs font-medium focus:border-blue-500 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                <FaSave />
                <span>{saving ? "Publishing Update..." : "Publish App Update"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Live In-App Preview */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-3">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
              <FaShieldAlt className="text-blue-400" />
              <span>Mobile In-App Modal Preview</span>
            </h3>

            {/* Mock Mobile Modal Frame */}
            <div className="p-5 rounded-2xl bg-[#0a1626] border border-[#234872] space-y-3 text-center shadow-inner">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/30">
                🚀
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                  {config.forceUpdate ? "MANDATORY SYSTEM UPDATE" : "NEW VERSION AVAILABLE"}
                </span>
                <h4 className="text-base font-black text-white">
                  Update to v{config.latestVersion}
                </h4>
              </div>

              <div className="p-3 rounded-xl bg-[#06101c] border border-gray-800 text-left space-y-1 text-gray-300 text-[11px] font-medium leading-relaxed whitespace-pre-line max-h-32 overflow-y-auto">
                {config.releaseNotes || "• Bug fixes and performance improvements."}
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black text-xs uppercase tracking-wider shadow"
                >
                  Update Now
                </button>
                {!config.forceUpdate && (
                  <button
                    type="button"
                    className="w-full py-1 text-gray-400 text-xs font-bold hover:text-white"
                  >
                    Later
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Explanations */}
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-gray-800 space-y-2 text-xs text-gray-300">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <FaListUl className="text-yellow-400" />
              <span>এটি যেভাবে কাজ করে:</span>
            </h4>
            <p>
              ১. যখনই আপনি এখানে নতুন ভার্সন ও লিংক দিয়ে <strong>&quot;Publish App Update&quot;</strong> করবেন, সমস্ত সক্রিয় অ্যাপ ওপেন হওয়ার সাথে সাথে অটোমেটিক নোটিফিকেশন পেয়ে যাবে।
            </p>
            <p>
              ২. <strong>Force Update ON</strong> থাকলে ইউজার আপডেট শেষ না করা পর্যন্ত অ্যাপ ব্যবহার করতে পারবে না।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
