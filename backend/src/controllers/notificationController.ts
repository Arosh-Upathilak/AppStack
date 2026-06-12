import { Request, Response } from "express";
import { AppError, asyncHandler } from "../utils/errorHandler";
import prisma from "../utils/prisma";

const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
    }, orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json({
    success: true,
    message: "Notification fetch successfully",
    notifications,
  });
});

const updateReadNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { notificationId } = req.body;

    const existNotification = await prisma.notification.findFirst({
      where: {
        userId,
        id: notificationId,
      },
    });

    if (!existNotification) {
      throw new AppError("Notification not found", 404);
    }

    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  },
);

const deleteNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { notificationId } = req.body;

    const existNotification = await prisma.notification.findFirst({
      where: {
        userId,
        id: notificationId,
      },
    });

    if (!existNotification) {
      throw new AppError("Notification not found", 404);
    }

    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  }
);

export {deleteNotification, updateReadNotification, getNotifications}