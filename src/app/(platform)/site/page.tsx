import { SiteSettingsForm } from "./site-settings-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ImageIcon, Sparkles } from "lucide-react";

export default function SiteSettingsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Quick link to Banner Management */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Homepage Slider Banners</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-xs text-gray-400">
              Upload multiple banner images, toggle active/inactive status, and arrange slider order.
            </p>
          </div>
        </div>
        <Link href="/banners">
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs cursor-pointer whitespace-nowrap">
            Manage Banners & Sliders
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site Settings</CardTitle>
          <CardDescription>
            Configure withdrawal limits, bonus amounts, and Tawk.to Live Chat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SiteSettingsForm />
        </CardContent>
      </Card>
    </div>
  );
}
