"use client";
import { signinSchema, SigninSchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { signInAction } from "@/action/signin";
import { toast } from "sonner";
import { INTERNAL_SERVER_ERROR } from "@/error";

const Login = () => {
  const [pending, startTr] = useTransition();

  const form = useForm<SigninSchema>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: SigninSchema) => {
    startTr(() => {
      signInAction(data)
        .then((res) => {
          if (res.success) {
            location.reload();
          } else if (res.error) {
            toast.error(res.error);
          }
        })
        .catch(() => {
          toast.error(INTERNAL_SERVER_ERROR);
        });
    });
  };
  return (
    <div className="fixed z-[1000] w-full h-screen flex justify-center items-center bg-background">
      <div className="w-[320px] md:w-[370px] lg:w-[420px] mx-auto mt-20 p-8 shadow-xl rounded-2xl border space-y-6">
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="email">Email</Label>
                  <FormControl>
                    <Input
                      disabled={pending}
                      id="email"
                      placeholder="admin@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="password">Password</Label>
                  <FormControl>
                    <Input
                      disabled={pending}
                      id="password"
                      type="password"
                      placeholder="••••••••"
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
              Sign In
            </Button>
          </form>
        </Form>

        
      </div>
    </div>
  );
};

export default Login;
