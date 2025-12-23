"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatWindowProps {
  recipientName: string;
  recipientRole: string;
  currentUserName: string;
  onClose: () => void;
}

export default function ChatWindow({
  recipientName,
  recipientRole,
  currentUserName,
  onClose,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<string[]>([
    "Xin chào!",
    "Bạn cần hỗ trợ gì?",
  ]);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setMessages([...messages, `${currentUserName}: ${text.trim()}`]);
    setText("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
      <Card className="p-4 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm text-gray-500">Trò chuyện với</p>
            <p className="font-semibold text-gray-900">
              {recipientName} ({recipientRole})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ×
          </button>
        </div>
        <div className="h-48 overflow-y-auto space-y-2 mb-3 text-sm">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className="rounded-lg bg-gray-100 px-3 py-2 text-gray-800"
            >
              {m}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập tin nhắn..."
          />
          <Button onClick={send} className="bg-blue-600 hover:bg-blue-700">
            Gửi
          </Button>
        </div>
      </Card>
    </div>
  );
}
