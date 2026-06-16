import { Request, Response } from "express";
import { asyncHandler, AppError } from "../utils/errorHandler";
import prisma from "../utils/prisma";
import { getAllPlatformSettings, DEFAULT_SETTINGS, SettingKey } from "../config/platformSettings";

export const getSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const settings = await getAllPlatformSettings();
    return res.status(200).json({
      success: true,
      settings,
    });
  },
);

export const updateSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const updates = req.body as Record<string, any>;

    if (!updates || typeof updates !== "object") {
      throw new AppError("Invalid settings payload", 400);
    }

    const keys = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

    await prisma.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(updates)) {
        if (!keys.includes(key as SettingKey)) {
          throw new AppError(`Invalid setting key: ${key}`, 400);
        }

        const parsed = parseInt(String(value), 10);
        if (isNaN(parsed) || parsed < 0) {
          throw new AppError(`Setting ${key} must be a non-negative integer`, 400);
        }

        await tx.platformSetting.upsert({
          where: { key },
          create: { key, value: String(parsed) },
          update: { value: String(parsed) },
        });
      }
    });

    const settings = await getAllPlatformSettings();
    return res.status(200).json({
      success: true,
      message: "Platform settings updated successfully",
      settings,
    });
  },
);
