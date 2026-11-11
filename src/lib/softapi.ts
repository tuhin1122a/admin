import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface SoftApiConfig {
  baseUrl: string;
  token: string;
  secret: string; // Must be 32 bytes/chars for AES-256-ECB
  callbackUrl: string;
  returnUrl: string;
  defaultCurrency: string;
  language: string;
  bharatMatkaLogo: string;
}

export interface SettleCallbackLog {
  serial_number: string;
  member_account: string;
  game_uid: string;
  game_name?: string;
  game_round?: string;
  bet_amount: number;
  win_amount: number;
  credit_amount: number;
  free_spin_bonus?: string;
  timestamp: string;
  receivedAt: string;
  status: "PROCESSED" | "DUPLICATE" | "USER_NOT_FOUND" | "ERROR";
  note?: string;
}

const CONFIG_FILE_PATH = path.join(process.cwd(), ".softapi-config.json");
const CALLBACK_LOG_PATH = path.join(process.cwd(), ".softapi-callbacks.json");

export function getSoftApiConfig(): SoftApiConfig {
  let saved: Partial<SoftApiConfig> = {};
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf8");
      saved = JSON.parse(raw);
    }
  } catch {
    // fallback to env
  }

  return {
    baseUrl:
      saved.baseUrl ||
      process.env.SOFTAPI_BASE_URL ||
      "https://world-casino-api.com/api/v1",
    token: saved.token ?? process.env.SOFTAPI_TOKEN ?? "",
    secret: saved.secret ?? process.env.SOFTAPI_SECRET ?? "",
    callbackUrl:
      saved.callbackUrl ||
      process.env.SOFTAPI_CALLBACK_URL ||
      "https://yoursite.com/api/softapi/callback",
    returnUrl:
      saved.returnUrl ||
      process.env.SOFTAPI_RETURN_URL ||
      "https://yoursite.com/lobby",
    defaultCurrency:
      saved.defaultCurrency || process.env.SOFTAPI_CURRENCY || "BDT",
    language: saved.language || "en",
    bharatMatkaLogo:
      saved.bharatMatkaLogo || process.env.SOFTAPI_BHARAT_MATKA_LOGO || "",
  };
}

export function saveSoftApiConfig(
  partial: Partial<SoftApiConfig>
): SoftApiConfig {
  const current = getSoftApiConfig();
  const updated: SoftApiConfig = {
    ...current,
    ...partial,
    baseUrl: (partial.baseUrl ?? current.baseUrl).replace(/\/+$/, ""),
  };
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}

/**
 * Encrypts a plaintext JSON object using AES-256-ECB with PKCS7 padding
 * as specified in Section 2 & 4 of Seamless SoftAPI Documentation.
 */
export function softApiEncrypt(
  plain: Record<string, any>,
  secret32: string
): string {
  const secretBuf = Buffer.from(secret32, "utf8");
  if (secretBuf.length !== 32) {
    throw new Error(
      `SOFTAPI_SECRET must be exactly 32 characters (currently ${secretBuf.length})`
    );
  }

  const jsonStr = JSON.stringify(plain);
  const cipher = crypto.createCipheriv("aes-256-ecb", secretBuf, null);
  cipher.setAutoPadding(true); // Node OpenSSL uses PKCS7 padding automatically
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(jsonStr, "utf8")),
    cipher.final(),
  ]);
  return encrypted.toString("base64");
}

/**
 * Decrypts Base64 AES-256-ECB ciphertext with PKCS7 padding
 * as specified in Section 5 (when account enc=1).
 */
export function softApiDecrypt(
  base64Payload: string,
  secret32: string
): Record<string, any> {
  const secretBuf = Buffer.from(secret32, "utf8");
  if (secretBuf.length !== 32) {
    throw new Error(
      `SOFTAPI_SECRET must be exactly 32 characters (currently ${secretBuf.length})`
    );
  }

  const decipher = crypto.createDecipheriv("aes-256-ecb", secretBuf, null);
  decipher.setAutoPadding(true);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(base64Payload, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}

/**
 * Converts a string/numeric player ID into a deterministic positive integer
 * if not already numeric, since SoftAPI requires `user_id` to be an `int`
 * ("Your player id. Same player always same id.").
 */
export function toNumericUserId(idOrPhone: string | number): number {
  if (typeof idOrPhone === "number" && Number.isInteger(idOrPhone)) {
    return idOrPhone;
  }
  const str = String(idOrPhone).trim();
  if (/^\d+$/.test(str)) {
    const parsed = parseInt(str, 10);
    if (Number.isSafeInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }
  // Deterministic 31-bit positive integer hash for cuid/string playerId
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash || 1001;
}

export function getRecentCallbackLogs(): SettleCallbackLog[] {
  try {
    if (fs.existsSync(CALLBACK_LOG_PATH)) {
      const raw = fs.readFileSync(CALLBACK_LOG_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
}

export function appendCallbackLog(entry: SettleCallbackLog): void {
  try {
    const logs = getRecentCallbackLogs();
    const updated = [entry, ...logs].slice(0, 100); // keep latest 100 logs
    fs.writeFileSync(
      CALLBACK_LOG_PATH,
      JSON.stringify(updated, null, 2),
      "utf8"
    );
  } catch (err) {
    console.error("Failed to write callback log:", err);
  }
}

export const SOFTAPI_CATEGORY_GGR_RATES = [
  { category: "Slots", rate: "6%", description: "Standard video & classic slots" },
  { category: "Live Casino", rate: "8%", description: "Evolution, Pragmatic Live, etc." },
  { category: "Sports", rate: "7%", description: "Sportsbook (excluding 9Wicket)" },
  { category: "IG ORIGINALS", rate: "0%", description: "0% (no GGR wallet debit)" },
  { category: "Other", rate: "6.5%", description: "Crash, arcade, table & instant games" },
  { category: "9Wicket (Separate)", rate: "13.5%", description: "13.5% of session loss (transfer wallet)" },
];

export const SOFTAPI_ERROR_CODES = [
  { code: 0, http: 200, meaning: "OK - Game launched / Request succeeded" },
  { code: 1, http: 200, meaning: "Invalid token format, decrypt failed, IP not allowed, or inactive" },
  { code: 7, http: 200, meaning: "Game / currency not available (or invalid Bharat Matka logo format)" },
  { code: 12, http: 200, meaning: "Low GGR Balance (Requires wallet > 0 and >= 5% of launch balance)" },
  { code: 400, http: 400, meaning: "Missing token / game_uid on list APIs" },
  { code: 401, http: 401, meaning: "Invalid token or inactive account" },
  { code: 403, http: 403, meaning: "Provider not active on your account / forbidden" },
  { code: 404, http: 404, meaning: "Game not found" },
  { code: 429, http: 429, meaning: "Games API rate limit (20 req/min per IP & token)" },
  { code: 1008, http: 502, meaning: "The game does not support trial/demo mode" },
];

