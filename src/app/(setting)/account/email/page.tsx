"use client";
import { emailChangeSchema, EmailChangeSchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FaKey } from "react-icons/fa6";
import { FaArrowLeftLong } from "react-icons/fa6";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { emailChange, sentVerificationMail } from "@/action/account";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";
import { useRouter } from "next/navigation";
import useCurrentUser from "@/hook/useCurrentUser";
import { FaCheck } from "react-icons/fa";

const EmailChangeForm = () => {
  const admin = useCurrentUser();
  const [pending, startTr] = useTransition();
  const [emailSent, setEmailSend] = useState(false);

  const form = useForm<EmailChangeSchema>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: {
      token: "",
      newEmail: "",
    },
  });

  const onSubmit = (data: EmailChangeSchema) => {
    startTr(() => {
      emailChange(data)
        .then((res) => {
          if (res.success) {
            toast.success("Email changed");
          } else if (res.error) {
            toast.error(res.error);
          }
        })
        .catch(() => {
          toast.error(INTERNAL_SERVER_ERROR);
        });
      setEmailSend(false);
    });
  };

  const handleSendVerificationCode = () => {
    startTr(() => {
      sentVerificationMail().then((res) => {
        if (res.success) {
          setEmailSend(true);
        } else if (res.error) {
          toast.error(res.error);
        }
      });
    });
  };

  const route = useRouter();

  return (
    <div>
      <div className=" w-full h-[80vh] flex justify-center items-center bg-background">
        <div className="relative w-[320px] md:w-[370px] lg:w-[420px] mx-auto mt-20 p-8 shadow-xl rounded-2xl border space-y-6">
          <h1 className="text-2xl font-bold text-center">
            <FaKey className="text-white w-7 h-7 mx-auto" /> Change Email
          </h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                name="email"
                render={() => (
                  <FormItem>
                    <Label htmlFor="email">Primary Email</Label>
                    <div className="flex items-center gap-1">
                      <FormControl>
                        <Input
                          value={admin!.email}
                          disabled
                          readOnly
                          id="email"
                          type="email"
                        />
                      </FormControl>
                      <Button
                        variant={"primary"}
                        disabled={pending || emailSent}
                        onClick={() => handleSendVerificationCode()}
                      >
                        {emailSent ? "Sent" : "Send"}
                      </Button>
                    </div>
                    <FormDescription>
                      {emailSent ? (
                        <span className="flex items-center gap-1">
                          <FaCheck className="w-4 h-4 text-white" />
                          Verification Code was sent to your Primary Email
                        </span>
                      ) : (
                        "A verification E-mail will be sent to your Primary E-mail with a Verification Code"
                      )}
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="token">Verification Code</Label>
                    <FormControl>
                      <Input
                        disabled={pending}
                        readOnly={!emailSent}
                        id="token"
                        type="text"
                        placeholder="Code"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="newEmail">New Email</Label>
                    <FormControl>
                      <Input
                        disabled={pending}
                        readOnly={!emailSent}
                        id="newEmail"
                        type="email"
                        placeholder="Enter a new email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                disabled={pending || !emailSent}
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

export default EmailChangeForm;
