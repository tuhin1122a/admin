"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import zod from "zod";
import { paymentWalletCreateSchema } from "@/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IoMdAlert } from "react-icons/io";
import { Loader2 } from "lucide-react";
import { useCreateWalletMutation } from "@/lib/features/paymentApiSlice";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { TagsInput } from "@/components/TagsInput";
import { PaymentWalletType } from "@prisma/client";

export interface PaymentTemplateOption {
  id: string;
  walletName: string;
  walletLogo: string;
  walletType: PaymentWalletType;
}

const CreateGatewayModal = ({
  children,
  subAdminId,
  templates = [],
}: {
  children: React.ReactNode;
  subAdminId?: string;
  templates?: PaymentTemplateOption[];
}) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"preset" | "custom">(
    templates.length > 0 ? "preset" : "custom"
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<zod.infer<typeof paymentWalletCreateSchema>>({
    defaultValues: {
      paymentWalletId: "",
      isActive: true,
      wallets: [],
      walletLogo: "",
      walletName: "",
      walletType: "EWALLET",
      trxType: "send-money",
      minDeposit: "100",
      maxDeposit: "25000",
      instructions: "",
      warning: "",
    },
    resolver: zodResolver(paymentWalletCreateSchema),
  });

  useEffect(() => {
    if (templates.length > 0 && mode === "preset" && !selectedTemplateId) {
      const first = templates[0];
      setSelectedTemplateId(first.id);
      form.setValue("paymentWalletId", first.id);
      form.setValue("walletName", first.walletName);
      form.setValue("walletLogo", first.walletLogo || "");
      form.setValue("walletType", first.walletType);
    }
  }, [templates, mode, selectedTemplateId, form]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      form.setValue("paymentWalletId", tpl.id);
      form.setValue("walletName", tpl.walletName);
      form.setValue("walletLogo", tpl.walletLogo || "");
      form.setValue("walletType", tpl.walletType);
    }
  };

  const handleModeSwitch = (nextMode: "preset" | "custom") => {
    setMode(nextMode);
    if (nextMode === "custom") {
      setSelectedTemplateId("");
      form.setValue("paymentWalletId", "");
      form.setValue("walletName", "");
      form.setValue("walletLogo", "");
      form.setValue("walletType", "EWALLET");
    } else if (templates.length > 0) {
      handleTemplateSelect(templates[0].id);
    }
  };

  const [createGateApi, { isLoading: creating }] = useCreateWalletMutation();

  const handleSubmit = (data: zod.infer<typeof paymentWalletCreateSchema>) => {
    const cleanMin = Number(data.minDeposit);
    const cleanMax = Number(data.maxDeposit);

    const asyncAction = async () => {
      const response = await createGateApi({
        paymentWalletId: data.paymentWalletId || undefined,
        wallets: data.wallets,
        walletLogo: data.walletLogo,
        walletName: data.walletName,
        walletType: data.walletType,
        isActive: data.isActive,
        subAdminId:
          subAdminId && subAdminId !== "default" && subAdminId !== "all"
            ? subAdminId
            : undefined,
        trxType: data.trxType || "send-money",
        minDeposit:
          Number.isFinite(cleanMin) && cleanMin > 0 ? cleanMin : 100,
        maxDeposit:
          Number.isFinite(cleanMax) && cleanMax > 0 ? cleanMax : 25000,
        instructions: data.instructions || "",
        warning: data.warning || "",
      }).unwrap();
      form.reset({
        paymentWalletId: "",
        isActive: true,
        wallets: [],
        walletLogo: "",
        walletName: "",
        walletType: "EWALLET",
        trxType: "send-money",
        minDeposit: "100",
        maxDeposit: "25000",
        instructions: "",
        warning: "",
      });
      setSelectedTemplateId("");
      setOpen(false);
      return response.success;
    };
    toast.promise(asyncAction(), {
      loading: "Creating...",
      success: () => "Gateway created",
      error: (error: any) => {
        if (error?.data?.error) {
          return `Error: ${error.data.error}`;
        } else {
          return INTERNAL_SERVER_ERROR;
        }
      },
    });
  };

  const [file, setFile] = useState<any>("");

  const uploadImage = useCallback(async (file: any) => {
    if (!file) return;
    setImageUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setImageUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signatureRes = await fetch("/api/sign-cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestamp }),
      });

      const { payload } = await signatureRes.json();
      const { signature, cloud_name, api_key } = payload;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", api_key);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await uploadRes.json();
      setImageUploading(false);
      return data.secure_url;
    } catch {
      setImageUploading(false);
      toast.error("Unknown Error Try again");
    }
  }, []);

  useEffect(() => {
    if (file) {
      uploadImage(file).then((imageUrl) => {
        if (imageUrl) {
          form.setValue("walletLogo", imageUrl);
        }
      });
    }
  }, [file, form, uploadImage]);

  const isLoading = creating || imageUploading;

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Payment Gateway</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {templates.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border p-1 bg-muted/40">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "preset" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => handleModeSwitch("preset")}
                >
                  Use Existing Method
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "custom" ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => handleModeSwitch("custom")}
                >
                  Custom Gateway
                </Button>
              </div>
            )}

            {mode === "custom" && (
              <Alert>
                <IoMdAlert className="h-4 w-4" />
                <AlertTitle>Heads up</AlertTitle>
                <AlertDescription>
                  Upload a clear logo and enter the gateway name (e.g. bKash,
                  Nagad, Rocket).
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
                {mode === "preset" && templates.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Select Payment Method</Label>
                    <Select
                      value={selectedTemplateId}
                      onValueChange={handleTemplateSelect}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((tpl) => (
                          <SelectItem key={tpl.id} value={tpl.id}>
                            {tpl.walletName} ({tpl.walletType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="walletName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wallet Name</FormLabel>
                          <FormControl>
                            <Input
                              disabled={isLoading}
                              {...field}
                              placeholder="e.g. bKash, Nagad, Rocket"
                              type="text"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="walletLogo"
                      render={() => (
                        <div>
                          <Label htmlFor="file" className="mb-2 block">
                            Wallet Logo
                          </Label>
                          <Input
                            disabled={isLoading}
                            type="file"
                            id="file"
                            onChange={(e) =>
                              setFile(e?.target?.files?.[0] || "")
                            }
                          />
                          {imageUploading && (
                            <div className="space-y-2 my-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{uploadProgress}%</span>
                                <span className="flex items-center">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Uploading...
                                </span>
                              </div>
                            </div>
                          )}
                          <FormMessage />
                        </div>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="wallets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet Numbers</FormLabel>
                      <FormControl>
                        <TagsInput
                          disabled={isLoading}
                          value={field.value}
                          onChange={(values) =>
                            form.setValue("wallets", values)
                          }
                          placeholder="Type phone number & press Enter..."
                          max={5}
                          maxLength={20}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="trxType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Type</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || "send-money"}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="send-money">
                                Send Money
                              </SelectItem>
                              <SelectItem value="cash-out">Cash Out</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minDeposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Deposit</FormLabel>
                        <FormControl>
                          <Input
                            disabled={isLoading}
                            type="number"
                            placeholder="100"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxDeposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Deposit</FormLabel>
                        <FormControl>
                          <Input
                            disabled={isLoading}
                            type="number"
                            placeholder="25000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          disabled={isLoading}
                          placeholder="Optional deposit instructions..."
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <div className="flex items-center gap-3">
                        <FormControl>
                          <Switch
                            disabled={isLoading}
                            id={"status"}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <Label
                          htmlFor="status"
                          className={`${
                            field.value ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {field.value ? "Active" : "InActive"}
                        </Label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="!rounded-button cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="!rounded-button cursor-pointer whitespace-nowrap text-white"
                  >
                    Create Gateway
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateGatewayModal;
