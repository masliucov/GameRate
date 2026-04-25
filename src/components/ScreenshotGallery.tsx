"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Screenshot } from "@/lib/rawg";

interface Props {
  screenshots: Screenshot[];
}

export default function ScreenshotGallery({ screenshots }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(() =>
    setLightbox((i) => (i === null ? null : (i - 1 + screenshots.length) % screenshots.length)),
    [screenshots.length]
  );
  const next = useCallback(() =>
    setLightbox((i) => (i === null ? null : (i + 1) % screenshots.length)),
    [screenshots.length]
  );

  // Keyboard navigation: arrows to change, Escape to close
  useEffect(() => {
    if (lightbox === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, close, prev, next]);

  // Lock page scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  return (
    <>
      {/* Grelha */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {screenshots.slice(0, 9).map((ss, i) => (
          <button
            key={ss.id}
            onClick={() => setLightbox(i)}
            className="relative aspect-video rounded-xl overflow-hidden group cursor-pointer"
            style={{ background: "var(--bg-subtle)" }}
          >
            <Image
              src={ss.image}
              alt={`Screenshot ${i + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Visualizador */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={close}
        >
          {/* Contentor da imagem */}
          <div
            className="relative w-full max-w-5xl mx-4"
            style={{ aspectRatio: "16/9" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              key={lightbox}
              src={screenshots[lightbox].image}
              alt={`Screenshot ${lightbox + 1}`}
              fill
              className="object-contain rounded-xl"
              sizes="100vw"
              priority
            />
          </div>

          {/* Fechar */}
          <button
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: "white" }}
          >
            <X size={20} />
          </button>

          {/* Anterior */}
          {screenshots.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: "white" }}
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Próximo */}
          {screenshots.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: "white" }}
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Contador e indicadores */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              {screenshots.slice(0, 9).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
                  className="rounded-full transition-all"
                  style={{
                    width: i === lightbox ? 20 : 6,
                    height: 6,
                    background: i === lightbox ? "white" : "rgba(255,255,255,0.35)",
                  }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {lightbox + 1} / {Math.min(screenshots.length, 9)}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
