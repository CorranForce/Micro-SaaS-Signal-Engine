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
      passwordHash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
      createdAt: new Date().toISOString()
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
}

export function getSettings(): ApiSettings {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, "settings.json");
  if (!fs.existsSync(filePath)) {
    return {
      supabaseUrl: "",
      supabaseAnonKey: "",
      resendApiKey: "",
      godaddyApiKey: "",
      godaddyApiSecret: ""
    };
  }
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return {
      supabaseUrl: "",
      supabaseAnonKey: "",
      resendApiKey: "",
      godaddyApiKey: "",
      godaddyApiSecret: ""
    };
  }
}

export function saveSettings(settings: ApiSettings) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, "settings.json");
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");
}
