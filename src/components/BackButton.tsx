"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 text-sm mb-6 transition-opacity hover:opacity-70 cursor-pointer"
      style={{ color: "var(--accent)" }}
    >
      <ChevronLeft size={15} />
      Voltar
    </button>
  );
}
