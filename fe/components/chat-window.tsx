"use client";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, User } from "lucide-react";

interface ChatWindowProps {
  recipientName: string;
  recipientRole: string;
  currentUserName: string;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: "me" | "other";
  text: string;
  timestamp: Date;
  senderName: string;
}

export default function ChatWindow({
  recipientName,
  recipientRole,
  currentUserName,
  onClose,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "other",
      text: "Xin chào!",
      timestamp: new Date(Date.now() - 120000), // 2 phút trước
      senderName: recipientName,
    },
    {
      id: "2",
      sender: "other",
      text: "Bạn cần hỗ trợ gì?",
      timestamp: new Date(Date.now() - 60000), // 1 phút trước
      senderName: recipientName,
    },
  ]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!text.trim() || isSending) return;

    setIsSending(true);

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "me",
      text: text.trim(),
      timestamp: new Date(),
      senderName: currentUserName,
    };

    setMessages([...messages, newMessage]);
    setText("");

    // Simulate API call delay
    setTimeout(() => {
      setIsSending(false);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm md:max-w-md lg:max-w-lg sm:bottom-0 sm:right-0 sm:max-w-none sm:h-screen sm:rounded-none">
      <Card className="p-4 sm:p-5 shadow-2xl sm:h-full sm:flex sm:flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{recipientName}</p>
              <p className="text-xs text-gray-500 capitalize">{recipientRole}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="min-h-64 max-h-96 sm:flex-1 sm:max-h-none overflow-y-auto mb-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="font-medium">Chưa có tin nhắn nào</p>
              <p className="text-sm">Bắt đầu trò chuyện nhé!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  msg.sender === "me" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    msg.sender === "me"
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                      : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                  }`}
                >
                  {msg.senderName.charAt(0).toUpperCase()}
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[70%] ${
                    msg.sender === "me" ? "items-end" : "items-start"
                  } flex flex-col gap-1`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      msg.sender === "me"
                        ? "bg-green-500 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-900 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 px-2">
                    {msg.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 items-end">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
            className="flex-1 resize-none min-h-[40px] max-h-[120px]"
            rows={1}
          />
          <Button
            onClick={send}
            disabled={!text.trim() || isSending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
            title="Gửi tin nhắn"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
