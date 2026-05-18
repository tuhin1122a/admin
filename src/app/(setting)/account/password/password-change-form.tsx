"use client";
import { passwordChangeSchema, PasswordChangeSchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FaKey } from "react-icons/fa6";
import { FaArrowLeftLong } from "react-icons/fa6";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { passwordChange } from "@/action/account";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { useRouter } from "next/navigation";

const PasswordChangeForm = () => {
  const [pending, startTr] = useTransition();

  const form = useForm<PasswordChangeSchema>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const onSubmit = (data: PasswordChangeSchema) => {
    startTr(() => {
      passwordChange(data)
        .then((res) => {
          if (res.success) {
            toast.success("Password changed");
          } else if (res.error) {
            toast.error(res.error);
          }
        })
        .catch(() => {
          toast.error(INTERNAL_SERVER_ERROR);
        });
    });
  };

  const route = useRouter();

  return (
    <div>
      <div className=" w-full h-screen flex justify-center items-center bg-background">
        <div className="relative w-[320px] md:w-[370px] lg:w-[420px] mx-auto mt-20 p-8 shadow-xl rounded-2xl border space-y-6">
          <h1 className="text-2xl font-bold text-center">
            <FaKey className="text-white w-7 h-7 mx-auto" /> Change Password
          </h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="password">Current Password</Label>
                    <FormControl>
                      <Input
                        disabled={pending}
                        id="password"
                        type="password"
                        placeholder="Current Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="password">New Password</Label>
                    <FormControl>
                      <Input
                        disabled={pending}
                        id="password"
                        type="password"
                        placeholder="New Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                disabled={pending}
                type="submit"
                className="w-full text-white cursor-pointer"
              >
                Change
              </Button>
            </form>
          </Form>

          <Button
            className="absolute -top-15 -left-15"
            variant={"outline"}
            aria-label="back button"
            title="back button"
            onClick={() => route.back()}
          >
            <FaArrowLeftLong className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeForm;
