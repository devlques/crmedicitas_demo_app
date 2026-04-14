"use client";

import { useState, useEffect } from "react";
import { TIME_SLOTS } from "@/lib/timeSlots";
import { MiniCalendar } from "@/app/components/MiniCalendar";
import { NavToggle } from "@/app/components/NavToggle";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

const MONTH_NAMES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${MONTH_NAMES[m - 1]} de ${y}`;
}

interface FormData {
  date: string;
  timeSlot: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

const EMPTY_FORM: FormData = { date: "", timeSlot: "", name: "", phone: "", email: "", notes: "" };

export default function BookingPage() {
  const [form, setForm]             = useState<FormData>(EMPTY_FORM);
  const [submitted, setSubmitted]   = useState(false);
  const [errors, setErrors]         = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!form.date) { setBookedSlots(new Set()); return; }
    setLoadingSlots(true);
    fetch(`/api/appointments?date=${form.date}`)
      .then((r) => r.json())
      .then((data) => setBookedSlots(new Set(data.map((a: { time: string }) => a.time))))
      .catch(() => setBookedSlots(new Set()))
      .finally(() => setLoadingSlots(false));
  }, [form.date]);

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.date)     e.date     = "Por favor selecciona una fecha.";
    if (!form.timeSlot) e.timeSlot = "Por favor selecciona un horario.";

    const nameTrimmed = form.name.trim();
    if (!nameTrimmed)                              e.name = "El nombre es obligatorio.";
    else if (nameTrimmed.length < 2)               e.name = "El nombre debe tener al menos 2 caracteres.";
    else if (nameTrimmed.length > 100)             e.name = "El nombre no puede superar los 100 caracteres.";
    else if (!/^[a-zA-ZÀ-ÿ\s'\-]+$/.test(nameTrimmed)) e.name = "El nombre solo puede contener letras y espacios.";

    const phoneClean = form.phone.replace(/[\s\-]/g, "");
    if (!form.phone.trim())                             e.phone = "El número de teléfono es obligatorio.";
    else if (!/^(\+506)?[2678]\d{7}$/.test(phoneClean)) e.phone = "Ingresa un número válido (Ej. +506 8888 1234).";

    const emailTrimmed = form.email.trim();
    if (!emailTrimmed)                                        e.email = "El correo electrónico es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) e.email = "Ingresa un correo electrónico válido.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleDateSelect(iso: string) {
    setForm((prev) => ({ ...prev, date: iso, timeSlot: "" }));
    setErrors((prev) => ({ ...prev, date: undefined }));
  }

  function handleTimeSelect(slot: string) {
    setForm((prev) => ({ ...prev, timeSlot: slot }));
    setErrors((prev) => ({ ...prev, timeSlot: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: form.date, time: form.timeSlot, name: form.name, phone: form.phone, email: form.email, notes: form.notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? "Ocurrió un error. Intenta de nuevo.");
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setErrors({});
    setServerError(null);
    setSubmitted(false);
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="card p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Cita registrada!</h2>
          <p className="text-gray-500 mb-1">
            <span className="font-semibold text-gray-700">{form.name}</span>, tu cita quedó agendada para el
          </p>
          <p className="text-teal font-semibold mb-1">{formatDate(form.date)}</p>
          <p className="text-gray-500 mb-6">a las <span className="font-semibold text-gray-700">{form.timeSlot}</span></p>
          <p className="text-sm text-gray-400 mb-8">
            Confirmaremos tu cita por teléfono y/o correo electrónico
          </p>
          <button onClick={handleReset} className="btn-primary w-full">
            Agendar otra cita
          </button>
        </div>
      </main>
    );
  }

  // ── Booking form ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Demo banner + nav */}
        <div className="flex items-center justify-between mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            DEMO · Sistema de Citas
          </span>
          <NavToggle />
        </div>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-navy rounded-2xl mb-4 shadow-md">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Reserva tu cita</h1>
          <p className="text-gray-400 mt-2 text-sm">Elige fecha, horario y completa tus datos.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* ── Calendar ── */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Selecciona una Fecha</h2>
            {form.date && (
              <p className="text-xs text-teal font-medium mb-3">{formatDate(form.date)}</p>
            )}
            {!form.date && <p className="text-xs text-gray-300 mb-3">Ninguna fecha seleccionada</p>}
            <MiniCalendar value={form.date} onChange={handleDateSelect} minDate={todayISO()} />
            {errors.date && <p className="text-red-500 text-xs mt-3">{errors.date}</p>}
          </div>

          {/* ── Time Slots ── */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Selecciona un Horario</h2>
              {loadingSlots && (
                <span className="text-xs text-gray-300 animate-pulse">Verificando disponibilidad…</span>
              )}
            </div>
            {!form.date ? (
              <p className="text-sm text-gray-300 text-center py-4">Primero selecciona una fecha</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isBooked   = bookedSlots.has(slot);
                  const isSelected = form.timeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBooked || loadingSlots}
                      onClick={() => handleTimeSelect(slot)}
                      className={[
                        "py-2.5 rounded-xl text-xs font-medium border transition-all",
                        isBooked
                          ? "bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed line-through"
                          : isSelected
                          ? "bg-teal text-white border-teal shadow-sm scale-[1.03]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-teal hover:text-teal-700 hover:bg-teal-50",
                      ].join(" ")}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
            {!loadingSlots && form.date && bookedSlots.size > 0 && (
              <p className="text-xs text-gray-300 mt-3">Los horarios tachados ya están reservados.</p>
            )}
            {errors.timeSlot && <p className="text-red-500 text-xs mt-2">{errors.timeSlot}</p>}
          </div>

          {/* ── Patient info ── */}
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Datos personales</h2>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Nombre Completo</label>
              <input
                type="text" name="name" value={form.name} onChange={handleChange}
                placeholder="Ej. María García"
                className={`input-base ${errors.name ? "border-red-400 bg-red-50 focus:ring-red-400" : ""}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Número de Teléfono</label>
              <input
                type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder="Ej. +506 8888 1234"
                className={`input-base ${errors.phone ? "border-red-400 bg-red-50 focus:ring-red-400" : ""}`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Correo Electrónico</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="Ej. maria@correo.com"
                className={`input-base ${errors.email ? "border-red-400 bg-red-50 focus:ring-red-400" : ""}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Notas <span className="text-gray-300 font-normal">(opcional)</span>
              </label>
              <textarea
                name="notes" value={form.notes} onChange={handleChange} rows={3}
                placeholder="Ej. Primera visita, alergia a la penicilina…"
                className="input-base resize-none"
              />
            </div>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={submitting} className="btn-primary w-full text-base">
            {submitting ? "Reservando…" : "Reservar ahora"}
          </button>

        </form>
      </div>
    </main>
  );
}
