"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check, Loader2, AlertCircle, Camera } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Props {
  user: { id: string; email: string; username: string; avatarUrl: string | null };
  onClose: () => void;
  onSave: (newUsername: string) => void;
  onAvatarChange: (url: string) => void;
}

type Availability = "idle" | "checking" | "available" | "taken" | "invalid";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SettingsModal({ user, onClose, onSave, onAvatarChange }: Props) {
  const currentName = user.username || user.email.split("@")[0];
  const [username, setUsername] = useState(currentName);
  const [availability, setAvailability] = useState<Availability>("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const debouncedUsername = useDebounce(username.trim(), 400);

  const isUnchanged = debouncedUsername === currentName;
  const initials = (user.username || user.email.split("@")[0])[0].toUpperCase();

  // Valida o formato do nome e verifica disponibilidade no Supabase
  useEffect(() => {
    const name = debouncedUsername;
    if (isUnchanged) { setAvailability("idle"); return; }
    if (name.length < 3) { setAvailability("invalid"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) { setAvailability("invalid"); return; }

    setAvailability("checking");
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id")
      .eq("username", name)
      .neq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setAvailability(data ? "taken" : "available"));
  }, [debouncedUsername, isUnchanged, user.id]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Image too large (max. 2MB)."); return; }
    setUploading(true);
    setError("");
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      setError("Error loading image.");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    const [profileRes, authRes] = await Promise.all([
      supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id),
      supabase.auth.updateUser({ data: { avatar_url: url } }),
    ]);
    if (profileRes.error || authRes.error) {
      setError("Erro ao atualizar foto de perfil.");
      setUploading(false);
      return;
    }
    setAvatarUrl(url);
    onAvatarChange(url);
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const name = username.trim();
    if (!name || saving) return;
    if (!isUnchanged && availability !== "available") return;

    setSaving(true);
    setError("");
    const supabase = createClient();

    const [profileRes, userRes] = await Promise.all([
      supabase.from("profiles").update({ username: name }).eq("id", user.id),
      supabase.auth.updateUser({ data: { username: name } }),
    ]);

    if (profileRes.error || userRes.error) {
      setError("Error saving. Please try again.");
    } else {
      onSave(name);
      onClose();
    }
    setSaving(false);
  }

  const inputStyle = {
    background: "var(--bg-input)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  };

  function AvailabilityIcon() {
    if (isUnchanged || username.trim() === currentName) return null;
    if (availability === "checking") return <Loader2 size={15} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />;
    if (availability === "available") return <Check size={15} className="text-green-500" />;
    if (availability === "taken") return <AlertCircle size={15} className="text-red-500" />;
    if (availability === "invalid") return <AlertCircle size={15} className="text-red-500" />;
    return null;
  }

  function availabilityMessage() {
    if (isUnchanged) return null;
    if (availability === "available") return <span className="text-green-600 text-xs">Name available</span>;
    if (availability === "taken") return <span className="text-red-500 text-xs">Name already taken</span>;
    if (availability === "invalid") return <span className="text-red-500 text-xs">Only letters, numbers and _ (min. 3 characters)</span>;
    return null;
  }

  const canSave = isUnchanged || availability === "available";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Settings</h2>
          <button onClick={onClose} className="transition-opacity hover:opacity-60" style={{ color: "var(--text-tertiary)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="relative group"
            title="Change profile photo"
          >
            <div
              className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-white relative"
              style={{ background: avatarUrl ? "transparent" : "var(--accent)" }}
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="80px" />
              ) : (
                initials
              )}
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100" style={{ background: "rgba(0,0,0,0.45)" }}>
              {uploading ? (
                <Loader2 size={20} className="text-white animate-spin" />
              ) : (
                <Camera size={20} className="text-white" />
              )}
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* Email (read-only) */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>Email</label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none opacity-60 cursor-not-allowed"
              style={inputStyle}
            />
          </div>

          {/* Username */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-tertiary)" }}>Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                maxLength={30}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none pr-10"
                style={inputStyle}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <AvailabilityIcon />
              </div>
            </div>
            <div className="mt-1 h-4">{availabilityMessage()}</div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={!canSave || saving}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40 mt-1"
            style={{ background: "var(--accent)" }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
