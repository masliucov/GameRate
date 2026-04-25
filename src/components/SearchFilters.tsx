"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Genre } from "@/lib/rawg";
import { SlidersHorizontal } from "lucide-react";

interface Props {
  genres: Genre[];
}

const ANOS = Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) => String(new Date().getFullYear() - i));

const selectStyle = {
  background: "var(--bg-input)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border)",
};

export default function SearchFilters({ genres }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    // Reset to first page when filters change
    next.delete("page");
    router.push(`/search?${next.toString()}`);
  }

  const genre = params.get("genre") ?? "";
  const year  = params.get("year")  ?? "";
  const hasFilters = genre || year;

  return (
    <div className="flex items-center gap-2 flex-wrap mt-3">
      <SlidersHorizontal size={13} style={{ color: "var(--text-tertiary)" }} />

      {/* Filtro por género */}
      <select
        value={genre}
        onChange={(e) => update("genre", e.target.value)}
        className="rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer"
        style={selectStyle}
      >
        <option value="">Todos os géneros</option>
        {genres.map((g) => (
          <option key={g.id} value={g.slug}>{g.name}</option>
        ))}
      </select>

      {/* Filtro por ano */}
      <select
        value={year}
        onChange={(e) => update("year", e.target.value)}
        className="rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer"
        style={selectStyle}
      >
        <option value="">Todos os anos</option>
        {ANOS.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      {/* Limpar filtros */}
      {hasFilters && (
        <button
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            next.delete("genre");
            next.delete("year");
            router.push(`/search?${next.toString()}`);
          }}
          className="text-xs px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-70"
          style={{ color: "var(--accent)" }}
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
