import "server-only";
import fs from "fs";
import path from "path";
import { encryptSecret, decryptSecret } from "./security";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Write via temp file + rename so a crash mid-write can't corrupt the store.
function writeJsonAtomic(filePath: string, value: unknown) {
  ensureDataDir();
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(value, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
}

export interface StoredUser {
  email: string;
  passwordHash: string;
  createdAt: string;
}

export function getUsers(): StoredUser[] {
  const filePath = path.join(DATA_DIR, "users.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUsers(users: StoredUser[]) {
  writeJsonAtomic(path.join(DATA_DIR, "users.json"), users);
}

export interface ApiSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  resendApiKey: string;
  godaddyApiKey: string;
  godaddyApiSecret: string;
  compactMode?: boolean;
  fontFamily?: string;
  fontSize?: string;
}

// Credential fields are encrypted at rest with the app secret.
const SECRET_FIELDS = [
  "supabaseAnonKey",
  "resendApiKey",
  "godaddyApiKey",
  "godaddyApiSecret",
] as const;

export function getSettings(): ApiSettings {
  const filePath = path.join(DATA_DIR, "settings.json");
  let fileSettings: Partial<ApiSettings> = {};

  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, "utf-8");
      fileSettings = JSON.parse(data);
      for (const field of SECRET_FIELDS) {
        if (fileSettings[field]) {
          fileSettings[field] = decryptSecret(fileSettings[field] as string);
        }
      }
    } catch {
      fileSettings = {};
    }
  }

  return {
    supabaseUrl:
      fileSettings.supabaseUrl ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "",
    supabaseAnonKey:
      fileSettings.supabaseAnonKey ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "",
    resendApiKey: fileSettings.resendApiKey || process.env.RESEND_API_KEY || "",
    godaddyApiKey:
      fileSettings.godaddyApiKey || process.env.GODADDY_API_KEY || "",
    godaddyApiSecret:
      fileSettings.godaddyApiSecret || process.env.GODADDY_API_SECRET || "",
    compactMode: fileSettings.compactMode || false,
    fontFamily: fileSettings.fontFamily || "inter",
    fontSize: fileSettings.fontSize || "base",
  };
}

export function saveSettings(settings: ApiSettings) {
  const toStore: ApiSettings = { ...settings };
  for (const field of SECRET_FIELDS) {
    if (toStore[field]) {
      toStore[field] = encryptSecret(toStore[field]);
    }
  }
  writeJsonAtomic(path.join(DATA_DIR, "settings.json"), toStore);
}
