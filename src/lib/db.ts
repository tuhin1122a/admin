import { PrismaClient } from "@prisma/client";

const DEFAULT_CONNECTION_LIMIT = process.env.PRISMA_CONNECTION_LIMIT || "10";
const DEFAULT_POOL_TIMEOUT = process.env.PRISMA_POOL_TIMEOUT || "20";
const DEFAULT_CONNECT_TIMEOUT = process.env.PRISMA_CONNECT_TIMEOUT || "10";

export function resolveValidDatabaseUrl(raw?: string): string {
  if (!raw || !raw.trim()) {
    return "";
  }

  const cleaned = raw
    .trim()
    .replace(/^DATABASE_URL\s*=\s*/i, "")
    .replace(/^["']+|["']+$/g, "")
    .trim();

  if (
    !cleaned.startsWith("postgresql://") &&
    !cleaned.startsWith("postgres://")
  ) {
    return cleaned;
  }

  try {
    const parsed = new URL(cleaned);

    if (!parsed.hostname.includes("pooler.supabase.com")) {
      parsed.searchParams.delete("pgbouncer");
    }

    const currentLimit = parsed.searchParams.get("connection_limit");
    if (!currentLimit || currentLimit === "1") {
      parsed.searchParams.set("connection_limit", DEFAULT_CONNECTION_LIMIT);
    }

    if (!parsed.searchParams.get("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", DEFAULT_POOL_TIMEOUT);
    }

    if (!parsed.searchParams.get("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", DEFAULT_CONNECT_TIMEOUT);
    }

    if (!parsed.searchParams.get("schema")) {
      parsed.searchParams.set("schema", "public");
    }

    return parsed.toString();
  } catch {
    return cleaned;
  }
}

const effectiveDatabaseUrl = resolveValidDatabaseUrl(process.env.DATABASE_URL);
if (effectiveDatabaseUrl) {
  process.env.DATABASE_URL = effectiveDatabaseUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(effectiveDatabaseUrl
      ? {
          datasources: {
            db: {
              url: effectiveDatabaseUrl,
            },
          },
        }
      : {}),
    log: ["error", "warn"],
  });

globalForPrisma.prisma = db;
