"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, User, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth-store";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

const createFallbackId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeMessage = (message: any): ChatMessage => ({
  id: message?.id || message?._id || createFallbackId(),
  senderId: message?.senderId?.toString?.() || "",
  receiverId: message?.receiverId?.toString?.() || "",
  content: message?.content || "",
  createdAt:
    typeof message?.createdAt === "string"
      ? message.createdAt
      : message?.createdAt?.toString?.() || new Date().toISOString(),
});

const sortMessages = (list: ChatMessage[]) =>
  [...list].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

const mergeMessages = (
  current: ChatMessage[],
  incoming: ChatMessage[] | any[]
) => {
  const normalized = (incoming || []).map(normalizeMessage);
  const map = new Map(current.map((msg) => [msg.id, msg]));
  normalized.forEach((msg) => map.set(msg.id, msg));
  return sortMessages(Array.from(map.values()));
};

const formatTime = (value: string) => {
  try {
    return new Date(value).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export default function ChatWindow({
  recipientId,
  recipientName,
  recipientRole,
  onClose,
}: ChatWindowProps) {
  const { user, accessToken } = useAuthStore();
  const currentUserId = user?._id || user?.id || "";
  const currentUserName = user?.name || "Bạn";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatGuardMessage = useMemo(() => {
    if (!recipientId) return "Không tìm thấy người nhận.";
    if (!accessToken) return "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.";
    return null;
  }, [recipientId, accessToken]);

  const allowChat = !chatGuardMessage;

  useEffect(() => {
    if (!allowChat) {
      setMessages([]);
      setIsHistoryLoading(false);
      return;
    }

    let cancelled = false;

    const fetchHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const response = await api.get("/chat/messages", {
          params: { with: recipientId },
        });
        if (cancelled) return;
        const payload = Array.isArray(response.data)
          ? response.data
          : response.data?.messages || [];
        setMessages((prev) => mergeMessages(prev, payload));
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError("Không thể tải lịch sử trò chuyện.");
        }
      } finally {
        if (!cancelled) {
          setIsHistoryLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [allowChat, recipientId]);

  useEffect(() => {
    if (!allowChat) {
      setSocketConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token: accessToken },
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit("chat:join", { withUserId: recipientId });
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleHistory = (history: ChatMessage[]) => {
      setMessages((prev) => mergeMessages(prev, history));
    };

    const handleMessage = (message: ChatMessage) => {
      setMessages((prev) => mergeMessages(prev, [message]));
    };

    const handleSocketError = (message: string) => {
      setError(message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("chat:history", handleHistory);
    socket.on("chat:message", handleMessage);
    socket.on("chat:error", handleSocketError);

    // Nếu socket đã kết nối sẵn
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.emit("chat:leave", { withUserId: recipientId });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("chat:history", handleHistory);
      socket.off("chat:message", handleMessage);
      socket.off("chat:error", handleSocketError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [allowChat, accessToken, recipientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(() => {
    const message = text.trim();
    if (!message || !socketRef.current || !socketConnected) return;

    setIsSending(true);
    socketRef.current.emit("chat:message", {
      receiverId: recipientId,
      content: message,
    });
    setText("");
    setTimeout(() => setIsSending(false), 150);
  }, [recipientId, socketConnected, text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const message = text.trim();
      if (!message) return;
      e.preventDefault();
      send();
    }
  };

  const canSend = Boolean(text.trim() && socketConnected && allowChat && !isSending);
  const statusLabel = socketConnected ? "Đang hoạt động" : "Đang kết nối...";
  const statusDot = socketConnected ? "bg-emerald-500" : "bg-amber-400";

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm md:max-w-md lg:max-w-lg sm:bottom-0 sm:right-0 sm:max-w-none sm:h-screen sm:rounded-none">
      <Card className="p-4 sm:p-5 shadow-2xl sm:h-full sm:flex sm:flex-col">
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{recipientName}</p>
              <p className="text-xs text-gray-500 capitalize">{recipientRole}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span className={`inline-flex h-2 w-2 rounded-full ${statusDot}`} />
                <span>{statusLabel}</span>
              </div>
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

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {chatGuardMessage && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {chatGuardMessage}
          </div>
        )}

        <div className="min-h-64 max-h-96 sm:flex-1 sm:max-h-none overflow-y-auto mb-4 space-y-3">
          {isHistoryLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mb-2" />
              <p>Đang tải tin nhắn...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="font-medium">Chưa có tin nhắn nào</p>
              <p className="text-sm">Bắt đầu trò chuyện nhé!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              const displayName = isMine ? currentUserName : recipientName;
              const avatarLetter = displayName.charAt(0).toUpperCase();

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                      isMine
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                        : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                    }`}
                  >
                    {avatarLetter}
                  </div>

                  <div
                    className={`max-w-[70%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isMine
                          ? "bg-green-500 text-white rounded-br-none"
                          : "bg-gray-100 text-gray-900 rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm break-words whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 px-2">
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 items-end">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
            className="flex-1 resize-none min-h-[40px] max-h-[120px]"
            rows={1}
            disabled={!allowChat || !socketConnected}
          />
          <Button
            onClick={send}
            disabled={!canSend}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
            title="Gửi tin nhắn"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
