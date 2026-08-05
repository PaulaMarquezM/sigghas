"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SBadge({ activo, labelOn = "Activo", labelOff = "Inactivo" }: { activo: boolean; labelOn?: string; labelOff?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 999,
      fontFamily: "JetBrains Mono, monospace", fontSize: 10.5,
      letterSpacing: "0.05em", fontWeight: 500,
      background: activo ? "color-mix(in oklab, #2E7D5B 15%, transparent)" : "#EFEAD9",
      color: activo ? "#2E7D5B" : "#8A8F99",
      border: `1px solid ${activo ? "color-mix(in oklab, #2E7D5B 30%, transparent)" : "#D8D1BD"}`,
    }}>
      {activo ? labelOn : labelOff}
    </span>
  );
}

const linkBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center",
  padding: "5px 12px", borderRadius: 7,
  border: "1px solid #D8D1BD", background: "#F5F1E8",
  fontSize: 12.5, fontWeight: 500, color: "#0E1116",
  textDecoration: "none", fontFamily: "Poppins, sans-serif",
  whiteSpace: "nowrap",
};

export function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} style={linkBtn}>{children}</Link>;
}

export function RowButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button
      {...props}
      disabled={props.disabled || pending}
      aria-busy={pending}
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "5px 12px", borderRadius: 7,
        border: "1px solid transparent", background: "transparent",
        fontSize: 12.5, fontWeight: 500, color: "#4A515E",
        cursor: pending ? "wait" : "pointer", fontFamily: "Poppins, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {pending ? <><Loader2 className="size-3.5 animate-spin" aria-hidden="true" />Procesando…</> : children}
    </button>
  );
}

export function RowActions({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center" }}>{children}</div>;
}
