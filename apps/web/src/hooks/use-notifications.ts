"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification-service";
import { useAuth } from "@/providers/auth-provider";
import type { Notification, NotificationsListResponse } from "@/types/notification";

const notificationsKey = ["notifications"] as const;
const WS_URL = process.env.NEXT_PUBLIC_BFF_WS_URL ?? "ws://localhost:8088/ws";

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: notificationsKey,
    queryFn: () => notificationService.list(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!user) return;

    const socket = new WebSocket(WS_URL);

    socket.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as Notification;

        queryClient.setQueryData<NotificationsListResponse>(notificationsKey, (current) => ({
          status: "SUCCESS",
          notifications: [notification, ...(current?.notifications ?? [])],
          unreadCount: (current?.unreadCount ?? 0) + 1,
        }));
      } catch {
        // ignore malformed messages
      }
    };

    return () => socket.close();
  }, [user, queryClient]);

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<NotificationsListResponse>(notificationsKey, (current) => {
        if (!current) return current;

        return {
          ...current,
          notifications: current.notifications?.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
          unreadCount: Math.max(0, (current.unreadCount ?? 0) - 1),
        };
      });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsKey });
      const previous = queryClient.getQueryData<NotificationsListResponse>(notificationsKey);

      queryClient.setQueryData<NotificationsListResponse>(notificationsKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          notifications: current.notifications?.map((notification) => ({
            ...notification,
            read: true,
          })),
          unreadCount: 0,
        };
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey });
    },
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
    markAsRead,
    markAllAsRead,
  };
}
