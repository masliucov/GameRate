"use client";

import { useState } from "react";
import { useUser } from "./SupabaseProvider";
import AuthModal from "./AuthModal";
import UserMenu from "./UserMenu";

export default function AuthButton() {
  const user = useUser();
  const [showModal, setShowModal] = useState(false);

  if (user) return <UserMenu />;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm font-semibold px-4 py-1.5 rounded-full text-white transition-opacity hover:opacity-80"
        style={{ background: "var(--accent)" }}
      >
        Sign in
      </button>
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}
