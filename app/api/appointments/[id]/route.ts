import { NextRequest, NextResponse } from "next/server";
import { readAll, saveAll, type AppointmentStatus } from "@/lib/db";
import { TIME_SLOTS } from "@/lib/timeSlots";

const VALID_STATUSES: AppointmentStatus[] = ["pending", "completed", "canceled"];

// ── PATCH /api/appointments/:id ────────────────────────────────────────────
// Accepts any combination of { status, date, time }.
// Only the fields that are sent get updated.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id   = Number(params.id);
  const body = await request.json();

  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `Estado inválido. Opciones: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  if (body.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json(
      { error: "Formato de fecha inválido. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  if (body.time !== undefined && !TIME_SLOTS.includes(body.time)) {
    return NextResponse.json(
      { error: "Horario inválido." },
      { status: 400 }
    );
  }

  const all   = readAll();
  const index = all.findIndex((a) => a.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Cita no encontrada." }, { status: 404 });
  }

  // Check for double-booking when date or time changes
  if (body.date !== undefined || body.time !== undefined) {
    const newDate = body.date ?? all[index].date;
    const newTime = body.time ?? all[index].time;
    const conflict = all.find(
      (a) => a.id !== id && a.date === newDate && a.time === newTime
    );
    if (conflict) {
      return NextResponse.json(
        { error: "Ese horario ya está reservado en esa fecha." },
        { status: 409 }
      );
    }
  }

  const updates: Partial<{ status: AppointmentStatus; date: string; time: string }> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.date   !== undefined) updates.date   = body.date;
  if (body.time   !== undefined) updates.time   = body.time;

  all[index] = { ...all[index], ...updates };
  saveAll(all);

  return NextResponse.json(all[index]);
}
