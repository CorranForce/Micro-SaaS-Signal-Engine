import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getUsers() {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, "users.json");
  if (!fs.existsSync(filePath)) {
    // Seed default admin account
    const defaultUser = {
      email: "corranforce@gmail.com",
      // sha256 hash of "password123"
      passwordHash:
        "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
      createdAt: new Date().toISOString(),
    };
    const initialUsers = [defaultUser];
    fs.writeFileSync(filePath, JSON.stringify(initialUsers, null, 2), "utf-8");
    return initialUsers;
  }
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function saveUsers(users: any[]) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, "users.json");
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf-8");
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

export function getSettings(): ApiSettings {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, "settings.json");
  let fileSettings: Partial<ApiSettings> = {};

  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, "utf-8");
      fileSettings = JSON.parse(data);
    } catch (e) {
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
  ensureDataDir();
  const filePath = path.join(DATA_DIR, "settings.json");
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
}
