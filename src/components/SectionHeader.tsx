import Link from "next/link";

interface Props {
  title: string;
  href?: string;
  subtitle?: string;
}

export default function SectionHeader({ title, href, subtitle }: Props) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--accent)" }}
        >
          Ver todos →
        </Link>
      )}
    </div>
  );
}
