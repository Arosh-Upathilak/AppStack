import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead?: boolean;
  createdAt?: string;
}

interface NotificationStore {
  notifications: Notification[];

  addNotification: (
    notification: Notification,
  ) => void;

  setNotifications: (
    notifications: Notification[],
  ) => void;

  markAsRead: (id: string) => void;

  clearNotifications: () => void;
}

export const useNotificationStore =
  create<NotificationStore>((set) => ({
    notifications: [],

    addNotification: (notification) =>
      set((state) => ({
        notifications: [
          notification,
          ...state.notifications,
        ],
      })),

    setNotifications: (notifications) =>
      set({ notifications }),

    markAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id
            ? { ...n, isRead: true }
            : n,
        ),
      })),

    clearNotifications: () =>
      set({ notifications: [] }),

  }));