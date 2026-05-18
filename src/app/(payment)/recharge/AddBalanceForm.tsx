"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserSearch } from "./UserSearch";
import { addBalanceToUsers } from "@/action/add-balance";
import { addBalanceSchema } from "@/schema";

type AddBalanceFormProps = {
  defaultUser?: User | null;
};

export function AddBalanceForm({ defaultUser }: AddBalanceFormProps) {
  const form = useForm<z.infer<typeof addBalanceSchema>>({
    resolver: zodResolver(addBalanceSchema),
    defaultValues: {
      amount: "0",
      message: "",
      userIds: defaultUser ? [defaultUser.id] : [],
    },
  });

  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: addBalanceToUsers,
    onSuccess: () => {
      toast.success("Balance added successfully!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      form.reset();
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to add balance", {
        description: error.message,
      });
    },
  });

  const onSubmit = (values: z.infer<typeof addBalanceSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="userIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Users</FormLabel>
              <FormControl>
                <UserSearch
                  selectedUsers={field.value}
                  onSelect={(ids) => field.onChange(ids)}
                  defaultUser={defaultUser}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a message to send with the balance update"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" variant={"primary"} disabled={mutation.isPending}>
          {mutation.isPending ? "Processing..." : "Add Balance"}
        </Button>
      </form>
    </Form>
  );
}
