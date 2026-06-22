"use client";

import { Users, BookOpen, Building2, Calendar, Clock } from "lucide-react";

const ICONS = { Users, BookOpen, Building2, Calendar, Clock } as const;
type IconName = keyof typeof ICONS;

export function QuickCard({
  icon, title, desc, href,
}: {
  icon: IconName; title: string; desc: string; href: string;
}) {
  const Icon = ICONS[icon];
  return (
    <a href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "#EFEAD9", border: "1px solid #D8D1BD",
          borderRadius: 12, padding: "24px 26px",
          cursor: "pointer", transition: "border-color .15s, transform .15s",
        }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#0E1116"; el.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#D8D1BD"; el.style.transform = "none"; }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 9,
          background: "#F5F1E8", border: "1px solid #D8D1BD",
          display: "grid", placeItems: "center",
          marginBottom: 16, color: "#0E1116",
        }}>
          <Icon style={{ width: 17, height: 17 }} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#0E1116", marginBottom: 6, letterSpacing: "-0.01em" }}>
          {title}
        </div>
        <div style={{ fontSize: 13.5, color: "#4A515E", lineHeight: 1.55 }}>
          {desc}
        </div>
      </div>
    </a>
  );
}
