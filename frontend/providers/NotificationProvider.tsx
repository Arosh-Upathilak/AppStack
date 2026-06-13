"use client";
import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { useNotificationStore } from "@/store/useNotificationStore";
import { getSocket } from "@/lib/socket";
import { getNotifications } from "@/lib/api/notification";
import type { Notification } from "@/store/useNotificationStore";

function isSellerDecision(notification: Notification) {
  return (
    notification.type === "SELLER_APPROVED" ||
    notification.type === "SELLER_REJECTED"
  );
}

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const processedSellerDecisions = useRef(new Set<string>());
  const { data: session, update } = useSession();

  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const setNotifications = useNotificationStore(
    (state) => state.setNotifications,
  );

  const refreshSellerSession = useCallback(
    async (notification: Notification, showToast: boolean) => {
      if (!isSellerDecision(notification)) return;
      if (processedSellerDecisions.current.has(notification.id)) return;

      processedSellerDecisions.current.add(notification.id);

      await update({ refreshUser: true });
      router.refresh();

      if (notification.type === "SELLER_APPROVED" && showToast) {
        toast.success(
          <div style={{ display: "grid", gap: 8 }}>
            <span>Your seller application was approved.</span>
            <button
              type="button"
              className="btn btn-primary"
              style={{ height: 34, justifyContent: "center" }}
              onClick={() => router.push("/seller")}
            >
              Open seller dashboard
            </button>
          </div>,
          { autoClose: 9000 },
        );
      }

      if (notification.type === "SELLER_REJECTED" && showToast) {
        toast.error("Your seller application was rejected. You can reapply from the buyer dashboard.");
      }
    },
    [router, update],
  );

  useEffect(() => {
    const socket = getSocket();

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  useEffect(() => {
    console.log("NotificationProvider mounted");
  }, []);

  useEffect(() => {
    const accessToken = session?.accessToken;

    if (!accessToken) return;

    // Fetch persisted notifications from the backend
    getNotifications()
      .then((res) => {
        if (res.success && res.notifications) {
          setNotifications(res.notifications);
          const sellerDecision = res.notifications.find(
            (notification) =>
              isSellerDecision(notification) && !notification.isRead,
          );

          if (sellerDecision) {
            void refreshSellerSession(sellerDecision, true);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch notifications:", err);
      });

    const socket = getSocket();

    socket.emit("register", accessToken);

    const handleNotification = (notification: Notification) => {
      addNotification(notification);
      void refreshSellerSession(notification, true);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [session, addNotification, refreshSellerSession, setNotifications]);

  return <>{children}</>;
}
