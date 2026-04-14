"use client";

import { useState, useEffect } from "react";

const DAY_NAMES  = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getTodayISO() {
  const t = new Date();
  return toISO(t.getFullYear(), t.getMonth(), t.getDate());
}

export function MiniCalendar({
  value,
  onChange,
  minDate,
}: {
  value: string;
  onChange: (iso: string) => void;
  minDate?: string;
}) {
  const today = getTodayISO();

  const [view, setView] = useState(() => {
    const src = value || today;
    const d   = new Date(src + "T12:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Keep calendar view in sync when value changes externally (e.g. form reset)
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T12:00:00");
      setView({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [value]);

  function prevMonth() {
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }

  function nextMonth() {
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  }

  // Monday-based grid (0 = Mon … 6 = Sun)
  const firstDow    = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="select-none w-full">
      {/* Month navigator */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-xl leading-none"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-700 tracking-wide">
          {MONTH_NAMES[view.month]} {view.year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-xl leading-none"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-300 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;

          const iso      = toISO(view.year, view.month, day);
          const selected = iso === value;
          const isToday  = iso === today;
          const disabled = minDate ? iso < minDate : false;

          return (
            <div key={i} className="flex justify-center">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(iso)}
                className={[
                  "w-9 h-9 flex items-center justify-center rounded-full text-sm transition-all",
                  selected
                    ? "bg-teal text-white font-semibold shadow-sm scale-105"
                    : isToday && !disabled
                    ? "ring-2 ring-teal text-teal-700 font-semibold hover:bg-teal-50"
                    : disabled
                    ? "text-gray-200 cursor-not-allowed"
                    : "text-gray-600 hover:bg-teal-50 hover:text-teal-700 cursor-pointer",
                ].join(" ")}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
