"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { getSocket } from "@/lib/socket";
import { getNotifications } from "@/lib/api/notification";

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const setNotifications = useNotificationStore(
    (state) => state.setNotifications,
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
    const accessToken = (session as any)?.accessToken;

    if (!accessToken) return;

    // Fetch persisted notifications from the backend
    getNotifications()
      .then((res) => {
        if (res.success && res.notifications) {
          setNotifications(res.notifications);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch notifications:", err);
      });

    const socket = getSocket();

    socket.emit("register", accessToken);

    const handleNotification = (notification: any) => {
      addNotification(notification);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [session, addNotification, setNotifications]);

  return <>{children}</>;
}