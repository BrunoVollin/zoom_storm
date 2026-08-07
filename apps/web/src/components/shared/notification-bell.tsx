"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  type LucideIcon,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import { ROUTES } from "@/constants/routes";
import type { Notification } from "@/types/notification";

// Mirrors `NotificationType` from the notifications-service domain
// (apps/notifications-service/src/domain/entities/Notification.ts). Kept as
// a plain string map here since the web app doesn't share types across
// service boundaries.
const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  ORDER_CREATED: ShoppingBag,
  ORDER_IN_TRANSIT: Truck,
  ORDER_OUT_FOR_DELIVERY: PackageCheck,
  ORDER_DELIVERED: CheckCircle2,
};

function getNotificationIcon(type: string): LucideIcon {
  return NOTIFICATION_ICONS[type] ?? Bell;
}

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  function handleSelect(notification: Notification) {
    if (!notification.read) markAsRead.mutate(notification.id);
    router.push(notification.orderId ? ROUTES.order(notification.orderId) : ROUTES.orders);
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unreadCount > 0 && !markAllAsRead.isPending) {
          markAllAsRead.mutate();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="notifications-trigger"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}`
              : "Notifications"
          }
          className="relative flex size-9 items-center justify-center rounded-md text-white/90 hover:bg-white/10 hover:text-white"
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <Badge
              aria-hidden="true"
              data-testid="notifications-count-badge"
              className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border-2 border-brand-purple bg-destructive p-0 text-[10px] font-semibold text-destructive-foreground"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-testid="notifications-menu" align="end">
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);

            return (
              <DropdownMenuItem
                key={notification.id}
                className={notification.read ? "opacity-60" : undefined}
                onSelect={() => handleSelect(notification)}
              >
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col gap-0.5">
                    <span>{notification.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString("en-US")}
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
