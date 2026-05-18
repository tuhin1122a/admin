"use client";
import React, { useEffect } from "react";
import Image from "next/image";
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

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import zod from "zod";
import { paymentWalletUpdateSchema } from "@/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";


import {
  useUpdateWalletsMutation,
} from "@/lib/features/paymentApiSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { Textarea } from "@/components/ui/textarea";
import { TagsInput } from "@/components/TagsInput";

const UpdateGatewayModal = ({
  children,
  defaultValues,
  id,
  label,
}: {
  children: React.ReactNode;
  id: string;
  defaultValues: zod.infer<typeof paymentWalletUpdateSchema>;
  label: {
    image: string;
    name: string;
    wallets: string[];
  };
}) => {
  const form = useForm<zod.infer<typeof paymentWalletUpdateSchema>>({
    resolver: zodResolver(paymentWalletUpdateSchema),
    defaultValues: {
      wallets: [],
      isActive: false,
      trxType: "",
      minDeposit: "",
      maxDeposit: "",
      instructions: "",
      warning: "",
    },
  });

  const [updateGatewayApi, { isLoading: updateing }] =
    useUpdateWalletsMutation();

  const handleSubmit = (data: zod.infer<typeof paymentWalletUpdateSchema>) => {
    const asyncAction = async () => {
      const response = await updateGatewayApi({
        id: id,
        maxDeposit: +data.maxDeposit,
        minDeposit: +data.minDeposit,
        trxType: data.trxType,
        instructions: data.instructions,
        isActive: data.isActive,
        wallets: data.wallets,
        warning: data.warning,
      }).unwrap();
      form.reset();
      return response.success;
    };

    toast.promise(asyncAction(), {
      loading: "Updating...",
      success: () => "Gateway Updated",
      error: (error: any) => {
        if (error?.data?.error) {
          return `Error: ${error.data.error}`;
        } else {
          return INTERNAL_SERVER_ERROR;
        }
      },
    });
  };

  const isLoading = updateing;

  useEffect(() => {
    if (defaultValues) {
      form.reset({ ...defaultValues });
    }
  }, [defaultValues, form, form.reset]);

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Upate Payment Gateway</DialogTitle>
            <div className="flex items-center justify-between py-1 px-3 mt-2 border rounded-md">
              <div className="">
                <Image src={label.image} alt={label.name} width={60} height={60} className="w-[60px]" />
                <span className="text-xs text-gray-300 block line-clamp-1">
                  {label.wallets.join(",")}
                </span>
              </div>

              <span className="text-sm font-semibold text-white capitalize">
                {label.name}
              </span>
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <FormField
                    control={form.control}
                    name="wallets"
                    render={({ field }) => (
                      <FormItem className="flex-1 ">
                        <FormLabel>Wallets</FormLabel>
                        <FormControl className="max-h-[70px] scrollbar-sm overflow-y-auto ">
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
                    name="trxType"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Transaction Type</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select transaction type" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
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
                </div>

                <div className="flex items-center justify-between gap-2">
                  <FormField
                    control={form.control}
                    name="minDeposit"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Minimum Deposit</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Minimum deposit amount"
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
                      <FormItem className="flex-1">
                        <FormLabel>Maximum Deposit</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Maximum deposit amount"
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
                      <FormLabel>Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional instructions"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warning"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warning</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional warning message"
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
                    <FormItem className="flex items-center gap-4">
                      <FormLabel>Is Active</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
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
                    Update Gateway
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

export default UpdateGatewayModal;
