"use client";

import { useState } from "react";

const LIMIT = 600;

function truncateAtWord(text: string, limit: number) {
  if (text.length <= limit) return text;
  const cut = text.lastIndexOf(" ", limit);
  return text.slice(0, cut > 0 ? cut : limit);
}

export default function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > LIMIT;
  const displayed = expanded || !needsTruncation ? text : truncateAtWord(text, LIMIT);

  return (
    <div>
      <p
        className="text-sm leading-relaxed whitespace-pre-line"
        style={{ color: "var(--text-secondary)" }}
      >
        {displayed}
        {!expanded && needsTruncation && "…"}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--accent)" }}
        >
          {expanded ? "Ver menos ↑" : "Ver mais ↓"}
        </button>
      )}
    </div>
  );
}
