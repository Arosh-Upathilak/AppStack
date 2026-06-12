import axios from "axios";
import { userAuthorization } from "@/hook/userAuthorization";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
  priority: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  message: string;
  notifications: Notification[];
}

export const getNotifications =
  async (): Promise<GetNotificationsResponse> => {
    const headers = await userAuthorization();

    const response =
      await axios.get<GetNotificationsResponse>(
        `${API_BASE}/notification/getNotifications`,
        {
          headers,
          withCredentials: true,
        }
      );

    return response.data;
  };

export const markNotificationAsRead = async (
  notificationId: string
) => {
  const headers = await userAuthorization();

  return axios.post(
    `${API_BASE}/notification/updateReadNotification`,
    { notificationId },
    {
      headers,
      withCredentials: true,
    }
  );
};

export const deleteNotification = async (
  notificationId: string
) => {
  const headers = await userAuthorization();

  return axios.delete(
    `${API_BASE}/notification/deleteNotification`,
    {
      headers,
      withCredentials: true,
      data: { notificationId },
    }
  );
};