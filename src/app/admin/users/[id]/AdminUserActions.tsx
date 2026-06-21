"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff, Ban, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Role } from "@/lib/auth/role";

interface Props {
  userId: string;
  currentRole: Role;
  isBanned: boolean;
  myRole: Role;
  isSelf: boolean;
}

export default function AdminUserActions({ userId, currentRole, isBanned, myRole, isSelf }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<null | "ban" | "unban" | "promote" | "demote">(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const isSuper = myRole === "super_admin";
  const targetIsSuper = currentRole === "super_admin";

  async function call(url: string, body: Record<string, unknown>, method: "POST" | "DELETE" = "POST") {
    setError("");
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Unexpected error");
      return false;
    }
    return true;
  }

  function setRole(role: Role) {
    startTransition(async () => {
      const ok = await call("/api/admin/role", { userId, role });
      if (ok) {
        setConfirm(null);
        router.refresh();
      }
    });
  }

  function setBan(banned: boolean) {
    startTransition(async () => {
      const ok = await call("/api/admin/ban", { userId, banned, reason: reason.trim() || undefined });
      if (ok) {
        setConfirm(null);
        setReason("");
        router.refresh();
      }
    });
  }

  if (isSelf) {
    return (
      <div
        className="rounded-2xl px-4 py-3 text-xs flex items-center gap-2"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-tertiary)" }}
      >
        <AlertTriangle size={14} /> This is your own account — no actions available here.
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex flex-wrap gap-2 items-center">
        {/* Promote / Demote (super_admin only) */}
        {isSuper && currentRole === "user" && (
          <button
            onClick={() => setConfirm("promote")}
            disabled={pending}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-white transition-opacity disabled:opacity-50"
            style={{ background: "#3b82f6" }}
          >
            <Shield size={13} /> Promote to admin
          </button>
        )}
        {isSuper && currentRole === "admin" && (
          <>
            <button
              onClick={() => setConfirm("promote")}
              disabled={pending}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-white transition-opacity disabled:opacity-50"
              style={{ background: "#a855f7" }}
            >
              <Shield size={13} /> Promote to super_admin
            </button>
            <button
              onClick={() => setConfirm("demote")}
              disabled={pending}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-opacity disabled:opacity-50"
              style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
            >
              <ShieldOff size={13} /> Demote to user
            </button>
          </>
        )}
        {isSuper && currentRole === "super_admin" && (
          <button
            onClick={() => setConfirm("demote")}
            disabled={pending}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-opacity disabled:opacity-50"
            style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
          >
            <ShieldOff size={13} /> Demote to admin
          </button>
        )}

        {/* Ban / Unban */}
        {!targetIsSuper && (
          isBanned ? (
            <button
              onClick={() => setBan(false)}
              disabled={pending}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-opacity disabled:opacity-50"
              style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
            >
              <CheckCircle2 size={13} /> Remove ban
            </button>
          ) : (
            <button
              onClick={() => setConfirm("ban")}
              disabled={pending}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-opacity disabled:opacity-50"
              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
            >
              <Ban size={13} /> Ban account
            </button>
          )
        )}

        {!isSuper && targetIsSuper && (
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Only a super_admin can act on this account.
          </span>
        )}
      </div>

      {/* Inline confirmations */}
      {confirm === "ban" && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Ban this account?
          </p>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          <div className="flex gap-2">
            <button onClick={() => setBan(true)} disabled={pending} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "#ef4444" }}>
              Confirm ban
            </button>
            <button onClick={() => { setConfirm(null); setReason(""); }} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {(confirm === "promote" || confirm === "demote") && (
        <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--bg-input)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {confirm === "promote"
              ? currentRole === "user" ? "Promote this account to admin?" : "Promote this account to super_admin?"
              : currentRole === "super_admin" ? "Demote this super_admin to admin?" : "Demote this admin to user?"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setRole(
                confirm === "promote"
                  ? (currentRole === "user" ? "admin" : "super_admin")
                  : (currentRole === "super_admin" ? "admin" : "user")
              )}
              disabled={pending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
              style={{ background: "var(--accent)" }}
            >
              Confirm
            </button>
            <button onClick={() => setConfirm(null)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
