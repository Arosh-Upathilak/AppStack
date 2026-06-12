"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getNotifications,
  markNotificationAsRead,
  Notification,
} from "@/lib/api/notification";
import { useNotificationStore } from "@/store/useNotificationStore";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const setStoreNotifications = useNotificationStore(
    (state) => state.setNotifications
  );

  const markAsRead = useNotificationStore(
    (state) => state.markAsRead
  );

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await getNotifications();

        setNotifications(response.notifications);

        // Update Zustand store so the sidebar badge updates
        setStoreNotifications(response.notifications);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [setStoreNotifications]);

  const handleRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Update Zustand store
      markAsRead(notificationId);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update notification");
    }
  };

  if (loading) {
    return (
      <div className="page screen-enter">
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="page screen-enter">
      <div className="page-head">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-sm text-ink-4">
            Stay updated with your latest activities.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 24,
        }}
      >
        {notifications.length === 0 ? (
          <div
            style={{
              padding: 24,
              border: "1px solid var(--line)",
              borderRadius: 12,
              textAlign: "center",
            }}
          >
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleRead(notification.id)}
              style={{
                padding: 16,
                borderRadius: 12,
                border: "1px solid var(--line)",
                background: notification.isRead
                  ? "var(--surface)"
                  : "#eef4ff",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {notification.title}
                </h3>

                {!notification.isRead && (
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#2563eb",
                    }}
                  />
                )}
              </div>

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: 14,
                }}
              >
                {notification.message}
              </p>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#94a3b8",
                }}
              >
                {notification.createdAt
                  ? new Date(notification.createdAt).toLocaleString()
                  : "Just now"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}