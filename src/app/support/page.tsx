"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UserChat {
  id: string;
  name: string | null;
  phone: string;
  playerId: string;
  lastMessage?: string;
  lastMessageTime?: string | Date;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

const SupportPage: React.FC = () => {
  const [users, setUsers] = useState<UserChat[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch users with active chats
  const fetchUsers = async (query = "") => {
    setIsLoadingUsers(true);
    try {
      const url = query.trim() !== "" 
        ? `/api/chat?search=${encodeURIComponent(query)}` 
        : "/api/chat";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching chat users:", err);
      toast.error("Failed to load chat users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch messages for selected user
  const fetchMessages = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/chat?userId=${selectedUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // Initial fetch for users
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => {
      // Only refresh the user list if search box is empty
      if (searchQuery.trim() === "") {
        fetchUsers();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync search query
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 400); // debounce input
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Sync messages for selected user
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedUser) {
      setIsLoadingMessages(true);
      fetchMessages().then(() => setIsLoadingMessages(false));
      
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedUser) return;
    const textToSend = inputMessage.trim();
    setInputMessage("");

    // Append locally immediately for snappy feel
    const tempMsg: Message = {
      id: Date.now().toString(),
      senderId: "support", // placeholder for self
      receiverId: selectedUser.id,
      content: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: textToSend,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to send message");
      } else {
        fetchMessages();
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-white rounded-lg shadow overflow-hidden border">
      {/* Sidebar - Users List */}
      <div className="w-1/3 md:w-1/4 border-r flex flex-col bg-gray-50/50">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <i className="fas fa-comments text-blue-500"></i> Support Chats
          </h2>
          <div className="relative">
            <Input
              placeholder="Search user ID or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {users.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-550 bg-blue-50 text-blue-900 border-l-4 border-blue-500"
                      : "hover:bg-gray-150 hover:bg-gray-100"
                  }`}
                >
                  <Avatar className="w-10 h-10 border shadow-sm">
                    <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${u.playerId}`} />
                    <AvatarFallback>{u.name ? u.name[0] : "P"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {u.name || `User ${u.playerId}`}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-1">
                      ID: <span className="font-mono">{u.playerId}</span>
                    </p>
                    {u.lastMessage && (
                      <p className="text-xs text-gray-400 truncate italic">
                        {u.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {users.length === 0 && !isLoadingUsers && (
              <div className="p-8 text-center text-gray-400">
                <i className="fas fa-user-slash text-2xl mb-2 block"></i>
                No active chat users found
              </div>
            )}
            {isLoadingUsers && users.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <i className="fas fa-spinner animate-spin text-xl mr-2"></i>
                Loading...
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* Header info */}
            <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border shadow-sm">
                  <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.playerId}`} />
                  <AvatarFallback>{selectedUser.name ? selectedUser.name[0] : "P"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-gray-800 text-sm md:text-base">
                    {selectedUser.name || `User ${selectedUser.playerId}`}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    Player ID: {selectedUser.playerId} | Phone: {selectedUser.phone}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Active Session
              </Badge>
            </div>

            {/* Chat message list */}
            <ScrollArea className="flex-1 p-4 bg-gray-50/50">
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <i className="fas fa-spinner animate-spin text-xl mr-2"></i> Loading messages...
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((msg, index) => {
                    const isAgent = msg.senderId !== selectedUser.id;
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex items-end gap-2 ${
                          isAgent ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isAgent && (
                          <Avatar className="w-6 h-6 border">
                            <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.playerId}`} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] p-3 rounded-xl shadow-sm text-sm ${
                            isAgent
                              ? "bg-blue-600 text-white rounded-br-none"
                              : "bg-white text-gray-800 border rounded-bl-none"
                          }`}
                        >
                          <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                          <span
                            className={`text-[9px] block mt-1 text-right leading-none ${
                              isAgent ? "text-blue-200" : "text-gray-400"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {isAgent && (
                          <Avatar className="w-6 h-6 border">
                            <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=support" />
                            <AvatarFallback>SA</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input field */}
            <div className="p-4 border-t bg-white">
              <div className="relative flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  className="flex-1 pr-16"
                />
                <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer px-5">
                  Send <i className="fas fa-paper-plane ml-1 text-xs"></i>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 bg-gray-50/20">
            <i className="far fa-comments text-5xl mb-3 text-gray-300"></i>
            <p className="text-base font-semibold text-gray-600">No Chat Selected</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
              Choose a user from the sidebar list, or search for a player ID to begin a live conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
