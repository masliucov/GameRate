"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("A password tem de ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As passwords não coincidem.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else {
      setDone(true);
      setTimeout(() => router.push("/"), 2000);
    }
    setLoading(false);
  }

  const inputStyle = {
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border-subtle)" }}
      >
        {checking ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>
            A verificar…
          </p>
        ) : !authed ? (
          <div className="text-center py-4">
            <h1 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Link inválido ou expirado
            </h1>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Pede um novo link de recuperação a partir da página de login.
            </p>
            <Link
              href="/"
              className="inline-block py-2.5 px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Voltar ao início
            </Link>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center text-center py-4 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)" }}>
              <CheckCircle2 size={28} style={{ color: "#22c55e" }} />
            </div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Password atualizada
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              A redirecionar para o início…
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-5 gap-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--accent)22" }}>
                <KeyRound size={26} style={{ color: "var(--accent)" }} />
              </div>
              <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Nova password
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Define a nova password para a tua conta.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Nova password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoFocus
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
                  style={inputStyle}
                />
              </label>
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Confirmar password
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none mt-1"
                  style={inputStyle}
                />
              </label>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white mt-2 transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {loading ? "A guardar…" : "Atualizar password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
