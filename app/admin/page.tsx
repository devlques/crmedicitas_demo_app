"use client";

import { useState, useEffect, useCallback } from "react";
import type { Appointment, AppointmentStatus } from "@/lib/db";
import { TIME_SLOTS } from "@/lib/timeSlots";
import { MiniCalendar } from "@/app/components/MiniCalendar";

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic",
];

function fmtDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending:   "Pendiente",
  completed: "Completada",
  canceled:  "Cancelada",
};

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  canceled:  "bg-red-50 text-red-500 border-red-200",
};

const STATUS_ACTIONS: Record<AppointmentStatus, { label: string; next: AppointmentStatus }[]> = {
  pending:   [{ label: "Completar", next: "completed" }, { label: "Cancelar", next: "canceled" }],
  completed: [{ label: "Pendiente", next: "pending"   }, { label: "Cancelar", next: "canceled" }],
  canceled:  [{ label: "Pendiente", next: "pending"   }],
};

// ── Create Modal ───────────────────────────────────────────────────────────

const EMPTY_CREATE = { date: "", time: TIME_SLOTS[0], name: "", phone: "", email: "", notes: "" };

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm]     = useState(EMPTY_CREATE);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function set(field: keyof typeof EMPTY_CREATE, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res  = await fetch("/api/appointments", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { onCreated(); onClose(); }
    else        { setError(data.error ?? "Error al crear la cita."); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Nueva Cita</h2>
          <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center rounded-lg text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Calendar */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Fecha *</label>
              <div className="border border-gray-200 rounded-xl p-4">
                <MiniCalendar value={form.date} onChange={(iso) => set("date", iso)} />
              </div>
              {form.date && (
                <p className="text-xs text-blue-600 font-medium mt-1.5">{fmtDate(form.date)}</p>
              )}
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Hora *</label>
              <select
                required value={form.time} onChange={(e) => set("time", e.target.value)}
                className="input-base"
              >
                {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Paciente *</label>
              <input
                type="text" required placeholder="Nombre completo"
                value={form.name} onChange={(e) => set("name", e.target.value)}
                className="input-base"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Teléfono *</label>
              <input
                type="tel" required placeholder="Ej: 8888-8888"
                value={form.phone} onChange={(e) => set("phone", e.target.value)}
                className="input-base"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Correo *</label>
              <input
                type="email" required placeholder="ejemplo@correo.com"
                value={form.email} onChange={(e) => set("email", e.target.value)}
                className="input-base"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Notas <span className="text-gray-300 font-normal">(opcional)</span>
              </label>
              <textarea
                rows={3} placeholder="Observaciones…"
                value={form.notes} onChange={(e) => set("notes", e.target.value)}
                className="input-base resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1 pb-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving || !form.date} className="flex-1 btn-primary py-2.5 text-sm">
                {saving ? "Guardando…" : "Crear cita"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────

function DetailModal({ appt, onClose }: { appt: Appointment; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Detalle de la cita</h2>
          <button onClick={onClose} className="btn-ghost w-8 h-8 flex items-center justify-center rounded-lg text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <span className={`badge ${STATUS_STYLES[appt.status]}`}>{STATUS_LABELS[appt.status]}</span>

          <dl className="space-y-3 text-sm">
            <DetailRow label="Fecha"    value={fmtDate(appt.date)} />
            <DetailRow label="Hora"     value={appt.time} />
            <DetailRow label="Paciente" value={appt.name} />
            <DetailRow label="Teléfono" value={appt.phone} />
            <DetailRow label="Correo"   value={appt.email || "—"} />
            <div>
              <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Notas</dt>
              <dd className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-3 text-sm leading-relaxed">
                {appt.notes || <span className="italic text-gray-300">Sin notas</span>}
              </dd>
            </div>
          </dl>

          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-xs font-medium text-gray-400 uppercase tracking-wide pt-0.5">{label}</dt>
      <dd className="text-gray-700">{value}</dd>
    </div>
  );
}

// ── Inline edit helpers ────────────────────────────────────────────────────

type EditState = { id: number; field: "date" | "time"; value: string } | null;

function EditableCell({ value, onClick, disabled }: { value: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className="group flex items-center gap-1.5 text-gray-700 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-default"
      title="Haz clic para editar"
    >
      {value}
      <span className="opacity-0 group-hover:opacity-100 text-blue-400 text-xs transition-opacity">✎</span>
    </button>
  );
}

function EditControls({ children, onSave, onCancel, busy }: { children: React.ReactNode; onSave: () => void; onCancel: () => void; busy: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {children}
      <button onClick={onSave} disabled={busy} className="text-emerald-600 hover:text-emerald-700 font-bold px-1 disabled:opacity-40" title="Guardar">
        {busy ? "…" : "✓"}
      </button>
      <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 px-1" title="Cancelar">✕</button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [dateFilter, setDateFilter]     = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [updating, setUpdating]         = useState<number | null>(null);
  const [editing, setEditing]           = useState<EditState>(null);
  const [serverError, setServerError]   = useState<string | null>(null);
  const [detailAppt, setDetailAppt]     = useState<Appointment | null>(null);
  const [showCreate, setShowCreate]     = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const url = dateFilter ? `/api/appointments?date=${dateFilter}` : "/api/appointments";
    const res  = await fetch(url);
    const data = await res.json();
    setAppointments(data);
    setLoading(false);
  }, [dateFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  async function patchAppointment(id: number, changes: Partial<Appointment>) {
    setUpdating(id);
    setServerError(null);
    const res  = await fetch(`/api/appointments/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes),
    });
    const data = await res.json();
    if (res.ok) setAppointments((prev) => prev.map((a) => (a.id === data.id ? data : a)));
    else        setServerError(data.error ?? "Error al actualizar.");
    setUpdating(null);
  }

  function startEdit(appt: Appointment, field: "date" | "time") {
    setEditing({ id: appt.id, field, value: appt[field] });
    setServerError(null);
  }

  async function saveEdit() {
    if (!editing) return;
    await patchAppointment(editing.id, { [editing.field]: editing.value });
    setEditing(null);
  }

  const visible = appointments
    .filter((a) => statusFilter === "all" || a.status === statusFilter)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const counts = {
    pending:   appointments.filter((a) => a.status === "pending").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    canceled:  appointments.filter((a) => a.status === "canceled").length,
  };

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-800 leading-tight">Panel de Citas</h1>
              <p className="text-xs text-gray-400">{appointments.length} cita{appointments.length !== 1 ? "s" : ""} en total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchAppointments} className="btn-ghost flex items-center gap-1.5">
              <span className="text-base leading-none">↺</span> Actualizar
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
            >
              <span className="text-lg leading-none">+</span> Nueva Cita
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {([
            { label: "Pendientes",  count: counts.pending,   style: "text-amber-600 bg-amber-50 border-amber-100"   },
            { label: "Completadas", count: counts.completed, style: "text-emerald-600 bg-emerald-50 border-emerald-100" },
            { label: "Canceladas",  count: counts.canceled,  style: "text-red-500 bg-red-50 border-red-100"          },
          ] as const).map(({ label, count, style }) => (
            <div key={label} className={`rounded-2xl border px-5 py-4 ${style}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium mt-0.5 opacity-70">{label}</p>
            </div>
          ))}
        </div>

        {/* Server error */}
        {serverError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {serverError}
          </div>
        )}

        {/* Filters */}
        <div className="card p-4 mb-5 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400">Filtrar por fecha</label>
            <input
              type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
              className="input-base max-w-[180px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | "all")}
              className="input-base max-w-[160px]"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="completed">Completada</option>
              <option value="canceled">Cancelada</option>
            </select>
          </div>
          {(dateFilter || statusFilter !== "all") && (
            <button
              onClick={() => { setDateFilter(""); setStatusFilter("all"); }}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mt-4"
            >
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-center text-gray-300 py-24 text-sm">Cargando citas…</p>
        ) : visible.length === 0 ? (
          <p className="text-center text-gray-300 py-24 text-sm">No hay citas para mostrar.</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha / Hora</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Paciente</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Contacto</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Notas</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((appt) => {
                  const isEditingDate = editing?.id === appt.id && editing.field === "date";
                  const isEditingTime = editing?.id === appt.id && editing.field === "time";
                  const isBusy        = updating === appt.id;

                  return (
                    <tr
                      key={appt.id}
                      className={`border-b border-gray-50 last:border-0 transition-colors hover:bg-blue-50/30 ${appt.status === "canceled" ? "opacity-50" : ""}`}
                    >
                      {/* Date / Time */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditingDate ? (
                          <EditControls onSave={saveEdit} onCancel={() => setEditing(null)} busy={isBusy}>
                            <input
                              type="date" value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              className="border border-blue-400 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </EditControls>
                        ) : (
                          <EditableCell value={fmtDate(appt.date)} onClick={() => startEdit(appt, "date")} disabled={editing !== null && editing.id !== appt.id} />
                        )}
                        <div className="mt-1">
                          {isEditingTime ? (
                            <EditControls onSave={saveEdit} onCancel={() => setEditing(null)} busy={isBusy}>
                              <select
                                value={editing.value}
                                onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                className="border border-blue-400 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </EditControls>
                          ) : (
                            <EditableCell value={appt.time} onClick={() => startEdit(appt, "time")} disabled={editing !== null && editing.id !== appt.id} />
                          )}
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-5 py-4 font-semibold text-gray-800 whitespace-nowrap">{appt.name}</td>

                      {/* Contact */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-gray-600">{appt.phone}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{appt.email || "—"}</p>
                      </td>

                      {/* Notes */}
                      <td className="px-5 py-4 max-w-[160px]">
                        {appt.notes ? (
                          <button
                            onClick={() => setDetailAppt(appt)}
                            className="text-left text-gray-500 truncate block w-full hover:text-blue-600 transition-colors text-xs"
                            title="Ver detalle completo"
                          >
                            {appt.notes}
                          </button>
                        ) : (
                          <span className="text-gray-200 italic text-xs">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`badge ${STATUS_STYLES[appt.status]}`}>
                          {STATUS_LABELS[appt.status]}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-stretch min-w-[110px]">
                          {STATUS_ACTIONS[appt.status].map(({ label, next }) => (
                            <button
                              key={next}
                              disabled={isBusy}
                              onClick={() => patchAppointment(appt.id, { status: next })}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-40 whitespace-nowrap"
                            >
                              {isBusy ? "…" : label}
                            </button>
                          ))}
                          <button
                            onClick={() => setDetailAppt(appt)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                          >
                            Ver detalle
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={fetchAppointments} />
      )}
      {detailAppt && (
        <DetailModal appt={detailAppt} onClose={() => setDetailAppt(null)} />
      )}
    </main>
  );
}
