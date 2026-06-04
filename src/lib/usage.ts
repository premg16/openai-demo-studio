import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDatabase } from "@/db/client";
import { usageLimits } from "@/db/schema";

const DEFAULT_FREE_DAILY_LIMIT = 5;
const MAX_MODEL_LENGTH = 80;

export type UsageResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: string;
};

export function getFreeDailyLimit() {
  const parsed = Number.parseInt(process.env.FREE_DAILY_LIMIT ?? "", 10);

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return DEFAULT_FREE_DAILY_LIMIT;
}

export function normalizeOptionalApiKey(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function normalizeOptionalModel(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const model = value.trim();

  if (
    !model ||
    model.length > MAX_MODEL_LENGTH ||
    !/^[A-Za-z0-9._:-]+$/.test(model)
  ) {
    return fallback;
  }

  return model;
}

export function getUsageResetAt(now = new Date()) {
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  ).toISOString();
}

function getRequestIdentity(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") ?? "unknown-agent";
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "local";

  return `${ip}:${userAgent}`;
}

function hashIdentity(identity: string) {
  return createHash("sha256").update(identity).digest("hex");
}

export async function consumeFreeUsage(request: Request): Promise<UsageResult> {
  const database = getDatabase();

  if (!database) {
    throw new Error("DATABASE_URL is required for free usage limits");
  }

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const limit = getFreeDailyLimit();
  const resetAt = getUsageResetAt(now);
  const identityHash = hashIdentity(getRequestIdentity(request));

  const [row] = await database
    .insert(usageLimits)
    .values({
      identityHash,
      day,
      count: 1,
    })
    .onConflictDoUpdate({
      target: [usageLimits.identityHash, usageLimits.day],
      set: {
        count: sql`${usageLimits.count} + 1`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ count: usageLimits.count });

  const count = row?.count ?? limit + 1;
  const remaining = Math.max(0, limit - count);

  return {
    allowed: count <= limit,
    limit,
    remaining,
    resetAt,
  };
}
