"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { INTERNAL_SERVER_ERROR } from "@/error";
import {
    useGetSiteSettingsQuery,
    useUpdateSiteSettingsMutation,
} from "@/lib/features/siteSettingsApi";
import {
    DEFAULT_TAWK_SETTINGS,
    DEFAULT_TAWK_WIDGET_URL,
    normalizeTawkWidgetUrl,
} from "@/lib/tawk";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Loader2, MessageSquareCode } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

// Define validation schema
const siteSettingsSchema = z.object({
  siteSettings: z.object({
    id: z.string().optional(),
    maxWithdraw: z.coerce.number().min(0, "Must be positive").optional(),
    minWithdraw: z.coerce.number().min(0, "Must be positive").optional(),
    dpTurnover: z.coerce.number().min(0, "Must be positive").optional(),
    sliderImages: z.array(z.string()).optional(),
    promotionsLogo: z.string().optional(),
  }),
  bonusSettings: z.object({
    id: z.string().optional(),
    signinBonus: z.coerce.number().int().min(0, "Must be positive"),
    referralBonus: z.coerce.number().int().min(0, "Must be positive"),
  }),
  tawkSettings: z.object({
    enabled: z.boolean(),
    widgetUrl: z.string(),
    showFloatingBubble: z.boolean(),
  }),
});

export type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;

export function SiteSettingsForm() {
  const { data, isLoading: isFetching } = useGetSiteSettingsQuery({});
  const [updateSettings, { isLoading: isUpdating }] =
    useUpdateSiteSettingsMutation();

  // State for file uploads
  const [sliderFiles, setSliderFiles] = useState<File[]>([]);
  const [promotionsLogoFile, setPromotionsLogoFile] = useState<File | null>(null);
  const [sliderPreviews, setSliderPreviews] = useState<string[]>([]);
  const [promotionsLogoPreview, setPromotionsLogoPreview] = useState<string>("");

  // Initialize form with existing images
  useEffect(() => {
    if (data?.siteSettings) {
      // Set previews for existing slider images
      if (data.siteSettings.sliderImages && data.siteSettings.sliderImages.length > 0) {
        setSliderPreviews(data.siteSettings.sliderImages);
      }
      // Set preview for existing promotions logo
      if (data.siteSettings.promotionsLogo) {
        setPromotionsLogoPreview(data.siteSettings.promotionsLogo);
      }
    }
  }, [data]);

  // Handle slider image file selection
  const handleSliderFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSliderFiles(files);
      
      // Create previews for selected images
      const previews = files.map(file => URL.createObjectURL(file));
      setSliderPreviews(previews);
    }
  };

  // Handle promotions logo file selection
  const handlePromotionsLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPromotionsLogoFile(file);
      setPromotionsLogoPreview(URL.createObjectURL(file));
    }
  };

  const normalizedValues = data
    ? {
        ...data,
        tawkSettings: {
          ...DEFAULT_TAWK_SETTINGS,
          ...(data.tawkSettings || {}),
        },
      }
    : undefined;

  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      siteSettings: {
        maxWithdraw: 0,
        minWithdraw: 0,
        dpTurnover: 0,
        sliderImages: [],
        promotionsLogo: "",
      },
      bonusSettings: {
        signinBonus: 5,
        referralBonus: 5,
      },
      tawkSettings: DEFAULT_TAWK_SETTINGS,
    },
    values: normalizedValues,
  });

  const tawkEnabled = form.watch("tawkSettings.enabled");
  const tawkWidgetUrl = form.watch("tawkSettings.widgetUrl");
  const normalizedPreview = normalizeTawkWidgetUrl(tawkWidgetUrl);

  const onSubmit = async (values: SiteSettingsFormValues) => {
  const asyncAction = async () => {
    const parsedTawk = normalizeTawkWidgetUrl(values.tawkSettings?.widgetUrl);
    if (!parsedTawk.valid) {
      throw new Error(
        "Invalid Tawk.to URL. Paste the embed.tawk.to URL or full script snippet."
      );
    }

    const sanitizedValues: SiteSettingsFormValues = {
      ...values,
      tawkSettings: {
        enabled: Boolean(values.tawkSettings?.enabled),
        widgetUrl: parsedTawk.url,
        showFloatingBubble:
          typeof values.tawkSettings?.showFloatingBubble === "boolean"
            ? values.tawkSettings.showFloatingBubble
            : true,
      },
    };

    // Upload images if any files are selected
    if (sliderFiles.length > 0 || promotionsLogoFile) {
      // Create FormData for image upload
      const formData = new FormData();
      
      // Add slider images to FormData
      sliderFiles.forEach((file) => {
        formData.append("sliderImages", file);
      });
      
      // Add promotions logo to FormData if selected
      if (promotionsLogoFile) {
        formData.append("promotionsLogo", promotionsLogoFile);
      }
      
      // Upload images to Cloudinary
      const uploadResponse = await fetch("/api/upload-images", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload images");
      }
      
      const uploadData = await uploadResponse.json();
      
      // Update values with uploaded image URLs
      const updatedValues = {
        ...sanitizedValues,
        siteSettings: {
          ...sanitizedValues.siteSettings,
          sliderImages: uploadData.sliderImages.length > 0 ? uploadData.sliderImages : sanitizedValues.siteSettings.sliderImages || [],
          promotionsLogo: uploadData.promotionsLogo || sanitizedValues.siteSettings.promotionsLogo || "",
        }
      };
      
      await updateSettings(updatedValues).unwrap();
    } else {
      // No files to upload, just update settings
      await updateSettings(sanitizedValues).unwrap();
    }
  };

    toast.promise(asyncAction(), {
      loading: "Updating...",
      success: () => "Setting updated",
      error: (error) => {
        if (error?.data?.error) {
          return `Error: ${error.data.error}`;
        } else if (error?.message) {
          return error.message;
        } else {
          return INTERNAL_SERVER_ERROR;
        }
      },
    });
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Site Settings Section */}
          <div className="space-y-4 p-6 border rounded-lg">
            <h3 className="text-lg font-medium">Withdrawal Settings</h3>

            <FormField
              control={form.control}
              name="siteSettings.maxWithdraw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Withdrawal</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="siteSettings.minWithdraw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Withdrawal</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="siteSettings.dpTurnover"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Turnover [X]</FormLabel>
                  <FormControl>
                    <Input type="number" max={5} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Bonus Settings Section */}
          <div className="space-y-4 p-6 border rounded-lg">
            <h3 className="text-lg font-medium">Bonus Settings</h3>

            <FormField
              control={form.control}
              name="bonusSettings.signinBonus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sign-in Bonus</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bonusSettings.referralBonus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral Bonus</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Tawk.to Live Chat Integration */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MessageSquareCode className="h-5 w-5 text-emerald-600" />
                <CardTitle>Live Chat (Tawk.to) Integration</CardTitle>
                <Badge
                  variant={tawkEnabled ? "default" : "secondary"}
                  className={
                    tawkEnabled
                      ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                      : ""
                  }
                >
                  {tawkEnabled ? "ACTIVE" : "DISABLED"}
                </Badge>
              </div>
              <CardDescription>
                Manage 24/7 Tawk.to live support across the web platform. Players
                automatically pass their Name, Phone &amp; Player ID to agents.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {normalizedPreview.valid && normalizedPreview.directChatUrl && (
                <Button type="button" variant="outline" size="sm" asChild>
                  <a
                    href={normalizedPreview.directChatUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Test Chat <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" asChild>
                <a
                  href="https://dashboard.tawk.to"
                  target="_blank"
                  rel="noreferrer"
                >
                  Tawk.to Inbox <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tawkSettings.enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5 pr-3">
                      <FormLabel className="text-base">
                        Enable Tawk.to Live Chat
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Loads Tawk.to live widget and routes Live Chat / Support
                        buttons straight to Tawk.to.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tawkSettings.showFloatingBubble"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5 pr-3">
                      <FormLabel className="text-base">
                        Show Floating Chat Bubble
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Displays the floating icon (hidden on game play &amp;
                        auth screens). If off, chat opens when clicking Live Chat
                        buttons.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        disabled={!tawkEnabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tawkSettings.widgetUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tawk.to Embed Script URL or Full &lt;script&gt; Snippet
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={DEFAULT_TAWK_WIDGET_URL}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw.includes("<script") || raw.includes("tawk.to")) {
                          const parsed = normalizeTawkWidgetUrl(raw);
                          if (parsed.valid) {
                            field.onChange(parsed.url);
                            return;
                          }
                        }
                        field.onChange(raw);
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Paste your full Tawk.to embed &lt;script&gt; snippet or
                    embed URL (e.g.{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {DEFAULT_TAWK_WIDGET_URL}
                    </code>
                    ) and we&apos;ll extract it automatically.
                  </p>
                  {!normalizedPreview.valid && tawkWidgetUrl && (
                    <p className="text-xs text-red-500">
                      Please enter a valid https://embed.tawk.to/&lt;propertyId&gt;/&lt;widgetId&gt; URL.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Slider Images Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Slider Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sliderImages">Upload Slider Images</Label>
                <Input
                  id="sliderImages"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleSliderFileChange}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload multiple images for the homepage slider
                </p>
              </div>
              
              {/* Preview of selected slider images */}
              {sliderPreviews.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Selected Images:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {sliderPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={preview}
                          alt={`Slider preview ${index + 1}`}
                          width={300}
                          height={128}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Promotions Logo Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Promotions Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="promotionsLogo">Upload Promotions Logo</Label>
                <Input
                  id="promotionsLogo"
                  type="file"
                  accept="image/*"
                  onChange={handlePromotionsLogoChange}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload logo for promotions section
                </p>
              </div>
              
              {/* Preview of selected promotions logo */}
              {promotionsLogoPreview && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Logo Preview:</h4>
                  <Image
                    src={promotionsLogoPreview}
                    alt="Promotions logo preview"
                    width={128}
                    height={128}
                    className="w-32 h-32 object-contain rounded-md"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" variant={"primary"} disabled={isUpdating} className="mt-8">
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </form>
    </Form>
  );
}
