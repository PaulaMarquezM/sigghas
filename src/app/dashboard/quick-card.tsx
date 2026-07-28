"use client";

import Link from "next/link";
import { ArrowUpRight, Users, BookOpen, Building2, Calendar, Clock } from "lucide-react";

const ICONS = { Users, BookOpen, Building2, Calendar, Clock } as const;
type IconName = keyof typeof ICONS;

export function QuickCard({
  icon, title, desc, href,
}: {
  icon: IconName; title: string; desc: string; href: string;
}) {
  const Icon = ICONS[icon];
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "#F5F1E8", border: "1px solid #D8D1BD",
          borderRadius: 16, padding: "26px 28px", minHeight: 188,
          cursor: "pointer", transition: "border-color .18s, transform .18s, box-shadow .18s",
          position: "relative", overflow: "hidden",
        }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#1D3FD9"; el.style.transform = "translateY(-3px)"; el.style.boxShadow = "0 16px 35px rgba(14,17,22,.10)"; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#D8D1BD"; el.style.transform = "none"; el.style.boxShadow = "none"; }}
      >
        <div style={{ position: "absolute", inset: "0 auto 0 0", width: 5, background: "#1D3FD9" }} />
        <ArrowUpRight style={{ position: "absolute", right: 20, top: 20, width: 18, height: 18, color: "#727984" }} />
        <div style={{
          width: 38, height: 38, borderRadius: 9,
          background: "#0E1116", border: "1px solid #0E1116",
          display: "grid", placeItems: "center",
          marginBottom: 18, color: "#F5F1E8",
        }}>
          <Icon style={{ width: 17, height: 17 }} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#0E1116", marginBottom: 8, letterSpacing: "-0.01em" }}>
          {title}
        </div>
        <div style={{ fontSize: 14.5, color: "#4A515E", lineHeight: 1.6 }}>
          {desc}
        </div>
      </div>
    </Link>
  );
}
