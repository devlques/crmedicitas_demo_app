"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavToggle() {
  const isAdmin = usePathname() === "/admin";

  return (
    <Link
      href={isAdmin ? "/" : "/admin"}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-500 hover:text-navy hover:border-navy transition-all shadow-sm"
    >
      {isAdmin ? "Ir a reserva de citas" : "Ir a panel de administración"}
    </Link>
  );
}
