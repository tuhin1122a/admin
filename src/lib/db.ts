import { PrismaClient } from "@prisma/client";

const SUPABASE_TRANSACTION_POOLER_URL =
  "postgresql://postgres.xcfditzqdvgwhcmdcztm:Tuhin%40Akhi1122@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

export function resolveValidDatabaseUrl(raw?: string): string {
  if (!raw) return SUPABASE_TRANSACTION_POOLER_URL;
  let cleaned = raw
    .trim()
    .replace(/^DATABASE_URL\s*=\s*/i, "")
    .replace(/^["']+|["']+$/g, "")
    .trim();

  if (
    (!cleaned.startsWith("postgresql://") && !cleaned.startsWith("postgres://")) ||
    cleaned.includes("localhost") ||
    cleaned.includes("127.0.0.1")
  ) {
    return SUPABASE_TRANSACTION_POOLER_URL;
  }

  if (cleaned.includes(".pooler.supabase.com:5432")) {
    cleaned = cleaned.replace(".pooler.supabase.com:5432", ".pooler.supabase.com:6543");
  }
  if (cleaned.includes(".pooler.supabase.com:6543") && !cleaned.includes("pgbouncer=true")) {
    const sep = cleaned.includes("?") ? "&" : "?";
    cleaned = `${cleaned}${sep}pgbouncer=true&connection_limit=1`;
  }

  return cleaned;
}

const effectiveDatabaseUrl = resolveValidDatabaseUrl(process.env.DATABASE_URL);
process.env.DATABASE_URL = effectiveDatabaseUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: effectiveDatabaseUrl,
      },
    },
    log: ["error", "warn"],
  });

globalForPrisma.prisma = db;
