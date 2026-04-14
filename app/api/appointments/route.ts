import { NextRequest, NextResponse } from "next/server";
import { readAll, saveAll, type Appointment } from "@/lib/db";

// ── GET /api/appointments ──────────────────────────────────────────────────
// Returns all appointments ordered by date + time.
// Optional: ?date=YYYY-MM-DD to filter by a specific day.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const all = readAll();
  const result = date ? all.filter((a) => a.date === date) : all;

  result.sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
  );

  return NextResponse.json(result);
}

// ── POST /api/appointments ─────────────────────────────────────────────────
// Creates a new appointment.
// Returns 400 for missing fields, 409 for a double-booking, 201 on success.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, time, name, phone, email, notes } = body;

  // 1. Validate all fields
  const validationErrors: string[] = [];

  if (!date || !time) validationErrors.push("Fecha y horario son obligatorios.");

  const nameTrimmed = name?.trim() ?? "";
  if (!nameTrimmed) {
    validationErrors.push("El nombre es obligatorio.");
  } else if (nameTrimmed.length < 2 || nameTrimmed.length > 100) {
    validationErrors.push("El nombre debe tener entre 2 y 100 caracteres.");
  } else if (!/^[a-zA-ZÀ-ÿ\s'\-]+$/.test(nameTrimmed)) {
    validationErrors.push("El nombre solo puede contener letras y espacios.");
  }

  const phoneClean = (phone ?? "").replace(/[\s\-]/g, "");
  if (!phone?.trim()) {
    validationErrors.push("El número de teléfono es obligatorio.");
  } else if (!/^(\+506)?[2678]\d{7}$/.test(phoneClean)) {
    validationErrors.push("Número de teléfono inválido.");
  }

  const emailTrimmed = email?.trim() ?? "";
  if (!emailTrimmed) {
    validationErrors.push("El correo electrónico es obligatorio.");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    validationErrors.push("Correo electrónico inválido.");
  }

  if (validationErrors.length > 0) {
    return NextResponse.json({ error: validationErrors[0] }, { status: 400 });
  }

  const all = readAll();

  // 2. Prevent double booking
  const conflict = all.find((a) => a.date === date && a.time === time);
  if (conflict) {
    return NextResponse.json(
      { error: "Ese horario ya está reservado. Por favor elige otro." },
      { status: 409 }
    );
  }

  // 3. Create and persist the new appointment
  const newAppointment: Appointment = {
    id: Date.now(),
    date,
    time,
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    notes: notes?.trim() ?? "",
    status: "pending",
    created_at: new Date().toISOString(),
  };

  saveAll([...all, newAppointment]);

  return NextResponse.json(newAppointment, { status: 201 });
}
