import fs from "fs";
import path from "path";

export type AppointmentStatus = "pending" | "completed" | "canceled";

export interface Appointment {
  id: number;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: AppointmentStatus;
  created_at: string;
}

const KEY     = "appointments";
const DB_PATH = path.join(process.cwd(), "appointments.json");

// ── Local: JSON file ───────────────────────────────────────────────────────

function readFile(): Appointment[] {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    const data: (Omit<Appointment, "status"> & { status?: AppointmentStatus })[] =
      JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    return data.map((a) => ({ status: "pending" as AppointmentStatus, ...a }));
  } catch {
    return [];
  }
}

function writeFile(appointments: Appointment[]): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(appointments, null, 2), "utf-8");
}

// ── Production: Redis ──────────────────────────────────────────────────────

let redisClient: import("redis").RedisClientType | null = null;

async function getRedis() {
  if (!redisClient) {
    const { createClient } = await import("redis");
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", () => { redisClient = null; });
    await redisClient.connect();
  }
  return redisClient;
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function readAll(): Promise<Appointment[]> {
  if (!process.env.REDIS_URL) return readFile();

  const redis = await getRedis();
  const raw   = await redis.get(KEY);
  if (!raw) return [];
  const data: (Omit<Appointment, "status"> & { status?: AppointmentStatus })[] = JSON.parse(raw);
  return data.map((a) => ({ status: "pending" as AppointmentStatus, ...a }));
}

export async function saveAll(appointments: Appointment[]): Promise<void> {
  if (!process.env.REDIS_URL) { writeFile(appointments); return; }

  const redis = await getRedis();
  await redis.set(KEY, JSON.stringify(appointments));
}
