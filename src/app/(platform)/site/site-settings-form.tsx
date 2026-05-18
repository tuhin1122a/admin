"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  useGetSiteSettingsQuery,
  useUpdateSiteSettingsMutation,
} from "@/lib/features/siteSettingsApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";

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
    },
    values: data || undefined,
  });

  const onSubmit = async (values: SiteSettingsFormValues) => {
  const asyncAction = async () => {
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
        ...values,
        siteSettings: {
          ...values.siteSettings,
          sliderImages: uploadData.sliderImages.length > 0 ? uploadData.sliderImages : values.siteSettings.sliderImages || [],
          promotionsLogo: uploadData.promotionsLogo || values.siteSettings.promotionsLogo || "",
        }
      };
      
      await updateSettings(updatedValues).unwrap();
    } else {
      // No files to upload, just update settings
      await updateSettings(values).unwrap();
    }
  };

    toast.promise(asyncAction(), {
      loading: "Updating...",
      success: () => "Setting updated",
      error: (error) => {
        if (error?.data?.error) {
          return `Error: ${error.data.error}`;
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
