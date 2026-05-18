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

const CreateGatewayModal = ({ children }: { children: React.ReactNode }) => {
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const form = useForm<zod.infer<typeof paymentWalletCreateSchema>>({
    defaultValues: {
      isActive: false,
      wallets: [],
      walletLogo: "",
      walletName: "",
      walletType: "EWALLET",
    },
    resolver: zodResolver(paymentWalletCreateSchema),
  });

  const [createGateApi, { isLoading: creating }] = useCreateWalletMutation();

  const handleSubmit = (data: zod.infer<typeof paymentWalletCreateSchema>) => {
    const asyncAction = async () => {
      const response = await createGateApi({
        wallets: data.wallets,
        walletLogo: data.walletLogo,
        walletName: data.walletName,
        walletType: data.walletType,
        isActive: data.isActive,
      }).unwrap();
      form.reset();
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
          console.log("Image url ", imageUrl);
          form.setValue("walletLogo", imageUrl);
        }
      });
    }
  }, [file, form, uploadImage]);

  const isLoading = creating || imageUploading;

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New Payment Gateway</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Alert>
              <IoMdAlert className="h-4 w-4" />
              <AlertTitle>Warning!</AlertTitle>
              <AlertDescription>
                You cannot change the wallet log and name further
              </AlertDescription>
            </Alert>
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
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
                          placeholder="Wallet Name"
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
                      <Label htmlFor="file" className="mb-2">
                        Wallet Logo
                      </Label>
                      <Input
                        disabled={isLoading}
                        type="file"
                        id="file"
                        onChange={(e) => setFile(e?.target?.files![0])}
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

                <FormField
                  control={form.control}
                  name="wallets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallets Number</FormLabel>
                      <FormControl>
                        <TagsInput
                          disabled={isLoading}
                          value={field.value}
                          onChange={(values) =>
                            form.setValue("wallets", values)
                          }
                          placeholder="Enter wallet numbers..."
                          max={5}
                          maxLength={20}
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
                            onCheckedChange={() => toast.error("Try later")}
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

            {/* {specificFields} */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateGatewayModal;
