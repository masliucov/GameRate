"use client";

import { useState } from "react";
import { X, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ onClose, defaultTab = "login" }: Props) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message === "Invalid login credentials" ? "Email ou password incorretos." : error.message);
    else onClose();
    setLoading(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) setError(error.message);
    else setRegistered(true);
    setLoading(false);
  }

  const inputStyle = {
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {registered ? (
          /* Ecrã de confirmação de email */
          <>
            <div className="flex items-center justify-end mb-2">
              <button onClick={onClose} className="transition-opacity hover:opacity-60" style={{ color: "var(--text-tertiary)" }}>
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col items-center text-center py-4 gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "var(--accent)22" }}
              >
                <Mail size={28} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                  Confirma o teu email
                </h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Enviámos um link de confirmação para
                </p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--accent)" }}>
                  {email}
                </p>
                <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
                  Abre o teu email e clica no link para ativar a conta.
                </p>
              </div>
              <button
                onClick={() => { setRegistered(false); setTab("login"); }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                Já confirmei, entrar
              </button>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Não recebeste o email? Verifica a pasta de spam.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-4">
                {(["login", "register"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(""); }}
                    className="text-sm font-semibold pb-1 border-b-2 transition-colors"
                    style={{
                      borderColor: tab === t ? "var(--accent)" : "transparent",
                      color: tab === t ? "var(--accent)" : "var(--text-tertiary)",
                    }}
                  >
                    {t === "login" ? "Entrar" : "Criar conta"}
                  </button>
                ))}
              </div>
              <button onClick={onClose} className="transition-opacity hover:opacity-60" style={{ color: "var(--text-tertiary)" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="flex flex-col gap-3">
              {tab === "register" && (
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nome de utilizador"
                  required
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={inputStyle}
              />

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white mt-1 transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {loading ? "A processar…" : tab === "login" ? "Entrar" : "Criar conta"}
              </button>
            </form>

            <p className="text-center text-xs mt-4" style={{ color: "var(--text-tertiary)" }}>
              {tab === "login" ? (
                <>Ainda não tens conta?{" "}
                  <button onClick={() => setTab("register")} className="font-medium" style={{ color: "var(--accent)" }}>Regista-te</button>
                </>
              ) : (
                <>Já tens conta?{" "}
                  <button onClick={() => setTab("login")} className="font-medium" style={{ color: "var(--accent)" }}>Entra aqui</button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
