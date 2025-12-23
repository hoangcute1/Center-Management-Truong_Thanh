"use client";
import { useState } from "react";
import { Bell, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export default function NotificationCenter({ userRole }: { userRole: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "success",
      title: "Thanh toán thành công",
      message: "Học phí tháng này đã được thanh toán",
      timestamp: new Date(),
      read: false,
    },
    {
      id: "2",
      type: "info",
      title: "Lịch học thay đổi",
      message: "Buổi học thứ 4 dời sang thứ 5",
      timestamp: new Date(),
      read: false,
    },
  ]);

  const unread = notifications.filter((n) => !n.read).length;
  const iconFor = (type: Notification["type"]) => {
    if (type === "success")
      return <CheckCircle className="text-green-600" size={18} />;
    if (type === "warning")
      return <AlertCircle className="text-orange-600" size={18} />;
    return <Info className="text-blue-600" size={18} />;
  };

  const markAll = () =>
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  const markOne = (id: string) =>
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  const remove = (id: string) =>
    setNotifications(notifications.filter((n) => n.id !== id));

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition"
      >
        <Bell size={22} />
        {unread > 0 && (
          <Badge
            className="absolute -top-1 -right-1 bg-red-600 text-white h-5 w-5 justify-center"
            variant="destructive"
          >
            {unread}
          </Badge>
        )}
      </button>
      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 shadow-2xl">
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <p className="font-semibold">Thông báo</p>
              <p className="text-xs text-gray-500">Vai trò: {userRole}</p>
            </div>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-blue-600">
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                Không có thông báo
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3 flex gap-2 items-start">
                  <div className="mt-1">{iconFor(n.type)}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{n.title}</p>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <div className="mt-1 flex gap-2 text-xs text-gray-500">
                      {!n.read && (
                        <button
                          onClick={() => markOne(n.id)}
                          className="text-blue-600"
                        >
                          Đánh dấu
                        </button>
                      )}
                      <button
                        onClick={() => remove(n.id)}
                        className="text-red-600"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
