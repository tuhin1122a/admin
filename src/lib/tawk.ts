export const TAWK_CONFIG_KEY = "tawk_to_config";
export const DEFAULT_TAWK_WIDGET_URL =
  "https://embed.tawk.to/6af470f6211af33c4aae43d6/default";

export interface TawkSettings {
  enabled: boolean;
  widgetUrl: string;
  showFloatingBubble: boolean;
}

export const DEFAULT_TAWK_SETTINGS: TawkSettings = {
  enabled: true,
  widgetUrl: DEFAULT_TAWK_WIDGET_URL,
  showFloatingBubble: true,
};

const TAWK_EMBED_REGEX =
  /https?:\/\/embed\.tawk\.to\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i;
const TAWK_DIRECT_REGEX =
  /https?:\/\/tawk\.to\/chat\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i;
const TAWK_SHORTHAND_REGEX = /^([a-zA-Z0-9]{16,})\/([a-zA-Z0-9_-]+)$/;

export function normalizeTawkWidgetUrl(
  rawInput?: string | null
): { valid: boolean; url: string; directChatUrl: string } {
  const raw = (rawInput ?? "").trim();
  if (!raw) {
    return {
      valid: true,
      url: DEFAULT_TAWK_WIDGET_URL,
      directChatUrl: getTawkDirectChatUrl(DEFAULT_TAWK_WIDGET_URL),
    };
  }

  let propertyId = "";
  let widgetId = "";

  const embedMatch = raw.match(TAWK_EMBED_REGEX);
  if (embedMatch) {
    propertyId = embedMatch[1];
    widgetId = embedMatch[2];
  } else {
    const directMatch = raw.match(TAWK_DIRECT_REGEX);
    if (directMatch) {
      propertyId = directMatch[1];
      widgetId = directMatch[2];
    } else {
      const shortMatch = raw.match(TAWK_SHORTHAND_REGEX);
      if (shortMatch) {
        propertyId = shortMatch[1];
        widgetId = shortMatch[2];
      }
    }
  }

  if (!propertyId || !widgetId) {
    return { valid: false, url: "", directChatUrl: "" };
  }

  const normalizedUrl = `https://embed.tawk.to/${propertyId}/${widgetId}`;
  return {
    valid: true,
    url: normalizedUrl,
    directChatUrl: `https://tawk.to/chat/${propertyId}/${widgetId}`,
  };
}

export function getTawkDirectChatUrl(widgetUrl?: string | null): string {
  const match = (widgetUrl || DEFAULT_TAWK_WIDGET_URL).match(TAWK_EMBED_REGEX);
  if (match) {
    return `https://tawk.to/chat/${match[1]}/${match[2]}`;
  }
  return "https://tawk.to/chat/6af470f6211af33c4aae43d6/default";
}

export function parseTawkConfig(rawValue?: string | null): TawkSettings {
  if (!rawValue) return { ...DEFAULT_TAWK_SETTINGS };
  try {
    const parsed = JSON.parse(rawValue);
    const normalized = normalizeTawkWidgetUrl(parsed?.widgetUrl);
    return {
      enabled:
        typeof parsed?.enabled === "boolean"
          ? parsed.enabled
          : DEFAULT_TAWK_SETTINGS.enabled,
      widgetUrl: normalized.valid
        ? normalized.url
        : DEFAULT_TAWK_WIDGET_URL,
      showFloatingBubble:
        typeof parsed?.showFloatingBubble === "boolean"
          ? parsed.showFloatingBubble
          : DEFAULT_TAWK_SETTINGS.showFloatingBubble,
    };
  } catch {
    return { ...DEFAULT_TAWK_SETTINGS };
  }
}
