import prisma from "../utils/prisma";

export const DEFAULT_SETTINGS = {
  SALES_FUND_LOCK_DAYS: 30,
  BILLING_MAX_RETRIES: 3,
  BILLING_RETRY_DELAY_DAYS: 1,
  PAYOUT_MIN_CENTS: 1000,
  REFUND_WINDOW_DAYS: 30,
};

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

export async function getPlatformSetting(key: SettingKey): Promise<number> {
  try {
    // 1. Try DB override
    const dbVal = await prisma.platformSetting.findUnique({
      where: { key },
    });
    if (dbVal) {
      const parsed = parseInt(dbVal.value, 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch (err) {
    console.error(`[PlatformSettings] Failed to fetch key ${key} from DB:`, err);
  }

  // 2. Try Env variable
  const envVal = process.env[key];
  if (envVal !== undefined) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed)) return parsed;
  }

  // 3. Fallback to default
  return DEFAULT_SETTINGS[key];
}

export async function getAllPlatformSettings() {
  const result: Record<string, number> = {};
  for (const key of Object.keys(DEFAULT_SETTINGS) as SettingKey[]) {
    result[key] = await getPlatformSetting(key);
  }
  return result;
}
