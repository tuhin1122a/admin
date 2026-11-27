import { PrismaClient } from "@prisma/client";
import { resolveValidDatabaseUrl } from "@/lib/db";

const DEFAULT_9XBAJI_DB_URL =
  process.env.NINE_X_BAJI_DATABASE_URL ||
  "postgres://postgres:Yg0YHudIENE0CPkaIrKOCEmdQAr56taRU234sy60iYasrKWsV0ulNM0uvZaJpU01@8n2mxqa2r7xqvfvnxqjdnxwr:5432/postgres?schema=public&connection_limit=5&pool_timeout=20&connect_timeout=10";

const globalFor9x = globalThis as unknown as {
  prisma9xBaji?: PrismaClient;
};

export function get9xBajiDb(): PrismaClient {
  if (!globalFor9x.prisma9xBaji) {
    const url = resolveValidDatabaseUrl(DEFAULT_9XBAJI_DB_URL);
    globalFor9x.prisma9xBaji = new PrismaClient({
      datasources: {
        db: { url },
      },
      log: ["error"],
    });
  }
  return globalFor9x.prisma9xBaji;
}
