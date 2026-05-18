"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SupportPage: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-5rem)]">
      <div className="w-1/4 border-r">
        <div className="p-4 border-b">
          <Input placeholder="Search users..." />
        </div>
        <ScrollArea className="h-full">
          <div className="p-4">
            <div className="flex items-center gap-4 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">John Doe</p>
                <p className="text-sm text-gray-500">Hello there!</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
      <div className="w-3/4 flex flex-col">
        <div className="p-4 border-b flex items-center gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <p className="font-semibold">John Doe</p>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-end gap-2">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="p-3 rounded-lg bg-gray-100">
                <p>
                  Hi, I am having trouble with my account.
                </p>
              </div>
            </div>
            <div className="flex items-end gap-2 justify-end">
              <div className="p-3 rounded-lg bg-blue-500 text-white">
                <p>
                  Hello! I am here to help. What seems to be the problem?
                </p>
              </div>
              <Avatar>
                <AvatarImage src="https://github.com/sub-admin.png" />
                <AvatarFallback>SA</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="relative">
            <Input placeholder="Type a message..." className="pr-16" />
            <Button className="absolute top-1/2 right-2 -translate-y-1/2">
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
