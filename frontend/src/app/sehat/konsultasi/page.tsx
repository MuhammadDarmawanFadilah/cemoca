"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";
import { Send, Smile } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatMessage {
  id: number;
  user: { 
    fullName: string; 
    username: string;
    avatarUrl?: string;
    photoPath?: string;
  };
  message: string;
  createdAt: string;
}

// Popular emojis for quick access
const EMOJI_LIST = [
  "😊", "😂", "❤️", "👍", "🙏", "😍", "🤔", "😢", "😅", "🔥",
  "✨", "👏", "💪", "🎉", "👌", "😎", "😇", "🤗", "😘", "💯",
  "🙌", "👀", "💖", "😴", "😱", "🤩", "😉", "🥰", "😭", "🤝",
  "💕", "🌟", "☺️", "😃", "😄", "😁", "🤣", "😆", "😋", "🥺"
];

export default function KonsultasiPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.error("No auth token found");
        return;
      }

      const response = await fetch(getApiUrl("/chat/messages?page=0&size=50"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((data.content || []).reverse());
      } else {
        console.error("Failed to fetch messages:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        toast.error("Anda harus login terlebih dahulu");
        setLoading(false);
        return;
      }

      const response = await fetch(getApiUrl("/chat/send"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (response.ok) {
        setNewMessage("");
        await fetchMessages();
      } else {
        const errorData = await response.json().catch(() => null);
        console.error("Send message error:", response.status, errorData);
        toast.error(errorData?.message || "Gagal mengirim pesan");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Terjadi kesalahan saat mengirim pesan");
    } finally {
      setLoading(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateSeparator = (dateString: string) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time to compare only dates
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const msgDate = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    
    if (msgDate.getTime() === todayDate.getTime()) {
      return "HARI INI";
    } else if (msgDate.getTime() === yesterdayDate.getTime()) {
      return "KEMARIN";
    } else {
      return messageDate.toLocaleDateString("id-ID", { 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      });
    }
  };

  const shouldShowDateSeparator = (currentMsg: ChatMessage, prevMsg: ChatMessage | null) => {
    if (!prevMsg) return true;
    
    const currentDate = new Date(currentMsg.createdAt);
    const prevDate = new Date(prevMsg.createdAt);
    
    return currentDate.toDateString() !== prevDate.toDateString();
  };

  const getAvatarUrl = (msg: ChatMessage) => {
    const photoPath = msg.user.photoPath || msg.user.avatarUrl;
    if (!photoPath) return null;
    
    // If it's a full URL, use it directly
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    
    // Otherwise, construct the URL from the backend
    return getApiUrl(`/files/${photoPath}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#efeae2] dark:bg-[#0b141a] chat-container">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-12 lg:px-20 py-4 space-y-2 chat-messages-area">
        {messages.map((msg, index) => {
          const isOwn = msg.user.username === user?.username;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showDateSeparator = shouldShowDateSeparator(msg, prevMsg);
          const avatarUrl = getAvatarUrl(msg);
          
          return (
            <div key={msg.id}>
              {/* Date Separator */}
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4">
                  <div className="bg-white/90 dark:bg-[#202c33]/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Message Bubble */}
              <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                {/* Avatar for other users */}
                {!isOwn && (
                  <div className="flex-shrink-0 mt-auto">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={msg.user.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user.fullName)}&background=25d366&color=fff&size=128`;
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-teal-600 dark:bg-teal-500 flex items-center justify-center text-white text-xs font-semibold">
                        {msg.user.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[65%]">
                  {!isOwn && (
                    <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 mb-0.5 px-2">
                      {msg.user.fullName}
                    </span>
                  )}
                  <div
                    className={`relative rounded-lg px-3 py-2 shadow-sm ${
                      isOwn
                        ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-foreground rounded-br-none chat-bubble-sent"
                        : "bg-white dark:bg-[#202c33] text-foreground rounded-bl-none chat-bubble-received"
                    }`}
                  >
                    <p className="text-[14px] sm:text-[15px] leading-relaxed break-words whitespace-pre-wrap pr-12">
                      {msg.message}
                    </p>
                    <span 
                      className={`text-[10px] absolute bottom-1.5 right-2 ${
                        isOwn 
                          ? "text-gray-600 dark:text-gray-300" 
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - WhatsApp Style */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
        <form onSubmit={sendMessage} className="flex items-center gap-2 p-2 sm:p-3 sm:px-6 md:px-12 lg:px-20">
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-accent shrink-0"
                title="Emoji"
              >
                <Smile className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[280px] sm:w-[320px] p-3 shadow-xl" 
              align="start"
              side="top"
            >
              <div className="grid grid-cols-8 gap-1.5">
                {EMOJI_LIST.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-2xl hover:bg-accent rounded p-1.5 transition-all hover:scale-110 active:scale-95"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            disabled={loading}
            className="flex-1 rounded-full border-none bg-white dark:bg-[#2a3942] focus-visible:ring-2 focus-visible:ring-[#00a884] px-4 py-2.5 h-11 text-[15px] shadow-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
          />

          <Button
            type="submit"
            disabled={loading || !newMessage.trim()}
            size="icon"
            className="h-11 w-11 rounded-full shrink-0 bg-[#25d366] hover:bg-[#1fb355] dark:bg-[#00a884] dark:hover:bg-[#008f6d] shadow-md transition-all active:scale-95 disabled:opacity-50"
            title="Kirim"
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </form>
      </div>
    </div>
  );
}
