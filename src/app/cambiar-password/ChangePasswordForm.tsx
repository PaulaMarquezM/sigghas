"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { changePassword } from "./actions";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";
import { logout } from "@/app/login/actions";

export function ChangePasswordForm({ nombre }: { nombre: string }) {
  const [state, formAction] = useActionState(changePassword, { ok: true });
  const [showPw, setShowPw] = useState(false);
  const firstName = nombre.trim().split(/\s+/)[0] || "docente";

  return (
    <div className="login-wrap">
      <aside className="login-art">
        <div className="login-art-grid" />
        <Link href="/" className="sigghas-brand" style={{ position: "relative", zIndex: 1 }}>
          <div className="sigghas-brand-mark" style={{ background: "#F5F1E8", color: "#0E1116" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M8 14h2v2H8zM14 14h2v2h-2z" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="sigghas-brand-name" style={{ color: "#F5F1E8" }}>SIGGHAS</div>
            <div className="sigghas-brand-sub">PUCE · Software</div>
          </div>
        </Link>
        <div className="login-quote">
          <span className="s-eyebrow" style={{ color: "color-mix(in oklab, #F5F1E8 60%, transparent)" }}>
            Primer acceso
          </span>
          <h2>
            Define tu<br />
            contraseña<br />
            <em>personal.</em>
          </h2>
          <p style={{ color: "color-mix(in oklab, #F5F1E8 60%, transparent)", fontSize: 15, lineHeight: 1.6, marginTop: 20, maxWidth: 400 }}>
            El coordinador creó tu cuenta con una contraseña temporal. Cámbiala para continuar.
          </p>
        </div>
      </aside>

      <main className="login-form-wrap">
        <div className="login-form">
          <div>
            <span className="s-eyebrow">Seguridad de la cuenta</span>
            <h1>Hola, {firstName}.<br />Cambia tu contraseña.</h1>
            <p className="s-body" style={{ marginTop: 14, maxWidth: 380 }}>
              Elige una contraseña de al menos 8 caracteres. No vuelvas a usar la temporal.
            </p>
          </div>

          {state.message ? (
            <div
              role="alert"
              style={{
                background: "color-mix(in oklab, #C8523B 12%, transparent)",
                border: "1px solid color-mix(in oklab, #C8523B 35%, transparent)",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 14,
                color: "#C8523B",
                fontWeight: 500,
              }}
            >
              {state.message}
            </div>
          ) : null}

          <form action={formAction} style={{ display: "grid", gap: "inherit" }}>
            <div className="s-field">
              <label htmlFor="password">Nueva contraseña</label>
              <div className="s-input-shell">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <button type="button" className="s-toggle-btn" aria-label="Mostrar contraseña" onClick={() => setShowPw((v) => !v)}>
                  {showPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.06 10.06 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="s-field">
              <label htmlFor="confirm">Confirmar contraseña</label>
              <div className="s-input-shell">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  id="confirm"
                  name="confirm"
                  type={showPw ? "text" : "password"}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <PendingSubmitButton pendingLabel="Guardando…" className="s-btn s-btn-primary s-btn-lg" style={{ width: "100%", justifyContent: "center", height: 48 }}>
              Guardar y continuar
            </PendingSubmitButton>
          </form>

          <form action={logout}>
            <button
              type="submit"
              className="s-small"
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                marginTop: 8,
                background: "none",
                border: 0,
                color: "#727984",
                cursor: "pointer",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
