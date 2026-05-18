"use client";

import { useState, useEffect } from "react";
import { User } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { searchUsers } from "@/action/add-balance";

interface UserSearchProps {
  selectedUsers: string[];
  onSelect: (ids: string[]) => void;
  defaultUser?: User | null;
}

export function UserSearch({
  selectedUsers,
  onSelect,
  defaultUser,
}: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<User[]>([]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", searchTerm],
    queryFn: () => searchUsers(searchTerm),
    enabled: open && searchTerm.length > 0,
  });

  useEffect(() => {
    if (
      defaultUser &&
      !selectedUserDetails.some((u) => u.id === defaultUser.id)
    ) {
      setSelectedUserDetails([defaultUser]);
    }
  }, [defaultUser, selectedUserDetails, setSelectedUserDetails]);

  const handleSelect = (user: User) => {
    if (!selectedUsers.includes(user.id)) {
      onSelect([...selectedUsers, user.id]);
      setSelectedUserDetails([...selectedUserDetails, user]);
    }
    setOpen(false);
    setSearchTerm("");
  };

  const removeUser = (userId: string) => {
    onSelect(selectedUsers.filter((id) => id !== userId));
    setSelectedUserDetails(selectedUserDetails.filter((u) => u.id !== userId));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedUserDetails.map((user) => (
          <Badge
            key={user.id}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {user.name} ({user.playerId})
            <button
              type="button"
              onClick={() => removeUser(user.id)}
              className="ml-1 rounded-full p-0.5 hover:bg-gray-200"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between"
          >
            Search users by phone or player ID...
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by phone or player ID..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {isLoading ? (
                <CommandEmpty>Searching...</CommandEmpty>
              ) : users.length === 0 ? (
                <CommandEmpty>No users found</CommandEmpty>
              ) : (
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => handleSelect(user)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {user.phone} | {user.playerId}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
