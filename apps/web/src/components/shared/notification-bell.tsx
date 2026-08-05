"use client";

import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notificações"
          className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full p-0 text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação por enquanto.
          </p>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={notification.read ? "opacity-60" : undefined}
              onSelect={() => {
                if (!notification.read) markAsRead.mutate(notification.id);
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span>{notification.message}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
