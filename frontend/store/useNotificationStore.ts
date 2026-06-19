import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead?: boolean;
  createdAt?: string;
  type?: string;
  priority?: string;
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

  deleteNotification: (id: string) => void;

  clearNotifications: () => void;
}

export const useNotificationStore =
  create<NotificationStore>((set) => ({
    notifications: [],

    addNotification: (notification) =>
      set((state) => {
        if (state.notifications.some((n) => n.id === notification.id)) {
          return { notifications: state.notifications };
        }
        return {
          notifications: [
            notification,
            ...state.notifications,
          ],
        };
      }),

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

    deleteNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

    clearNotifications: () =>
      set({ notifications: [] }),

  }));