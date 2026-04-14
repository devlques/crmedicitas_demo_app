import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "appointments.json");

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

// Read all appointments — any existing record without a status defaults to "pending"
export function readAll(): Appointment[] {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    return data.map((a: Omit<Appointment, "status"> & { status?: AppointmentStatus }) => ({
      status: "pending" as AppointmentStatus,
      ...a,
    }));
  } catch {
    return [];
  }
}

// Write the full appointments array back to the JSON file
export function saveAll(appointments: Appointment[]): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(appointments, null, 2), "utf-8");
}
