"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { getSocket } from "@/lib/socket";

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  const addNotification = useNotificationStore(
    (state) => state.addNotification,
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
    const userId = (session?.user as any)?.id;

    if (!userId) return;

    const socket = getSocket();

    socket.emit("register", userId);

    const handleNotification = (notification: any) => {
      addNotification(notification);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [session?.user, addNotification]);

  return <>{children}</>;
}