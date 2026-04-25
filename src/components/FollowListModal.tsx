"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface Props {
  profileId: string;
  type: "followers" | "following";
  onClose: () => void;
}

export default function FollowListModal({ profileId, type, onClose }: Props) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/follows?profileId=${profileId}&type=${type}`);
      const json = await res.json();
      setUsers(json.users ?? []);
      setLoading(false);
    }
    load();
  }, [profileId, type]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
            {type === "followers" ? "Seguidores" : "A seguir"}
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-tertiary)" }}>
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: "var(--text-tertiary)" }}>
              {type === "followers" ? "Sem seguidores ainda" : "Não segue ninguém ainda"}
            </p>
          ) : (
            <ul>
              {users.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/users/${u.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-5 py-3 transition-opacity hover:opacity-70"
                  >
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0 relative"
                      style={{ background: u.avatar_url ? "transparent" : "var(--accent)" }}
                    >
                      {u.avatar_url ? (
                        <Image src={u.avatar_url} alt={u.username} fill className="object-cover" sizes="36px" />
                      ) : (
                        (u.username?.[0] ?? "?").toUpperCase()
                      )}
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{u.username}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
