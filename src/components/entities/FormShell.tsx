import Link from "next/link";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";

export function FormShell({
  title,
  backHref,
  children,
}: {
  title: string;
  backHref: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ maxWidth: 680 }}>
      <Link href={backHref} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 13, color: "#4A515E", textDecoration: "none",
        fontFamily: "Poppins, sans-serif", marginBottom: 24,
      }}>
        <ArrowLeft style={{ width: 14, height: 14 }} />
        Volver
      </Link>

      <div style={{
        border: "1px solid #D8D1BD", borderRadius: 12,
        background: "#EFEAD9", overflow: "hidden",
      }}>
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid #D8D1BD",
        }}>
          <span style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 10.5,
            textTransform: "uppercase", letterSpacing: "0.12em", color: "#4A515E",
          }}>
            {title}
          </span>
        </div>
        <div style={{ padding: 24, background: "#F5F1E8" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function FormActions({ cancelHref }: { cancelHref: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "flex-end", gap: 10,
      paddingTop: 24, marginTop: 8, borderTop: "1px solid #D8D1BD",
    }}>
      <Link href={cancelHref} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "10px 18px", borderRadius: 8,
        border: "1px solid #D8D1BD", background: "#F5F1E8",
        fontSize: 13.5, fontWeight: 500, color: "#0E1116",
        textDecoration: "none", fontFamily: "Poppins, sans-serif",
      }}>
        Cancelar
      </Link>
      <PendingSubmitButton pendingLabel="Guardando…" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "10px 18px", borderRadius: 8,
        background: "#0E1116", color: "#F5F1E8",
        fontSize: 13.5, fontWeight: 500, border: 0,
        cursor: "pointer", fontFamily: "Poppins, sans-serif",
      }}>
        <Save style={{ width: 14, height: 14 }} />
        Guardar
      </PendingSubmitButton>
    </div>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      padding: "14px 16px", borderRadius: 10, marginBottom: 18,
      background: "#FFF1ED", border: "1px solid #E7A796",
      fontSize: 14, color: "#7F2E20", lineHeight: 1.5,
    }}>
      <AlertCircle style={{ width: 20, height: 20, flexShrink: 0, marginTop: 1 }} />
      <div><strong style={{ display: "block", marginBottom: 2 }}>No pudimos guardar</strong>{message}</div>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  required = true,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{
      display: "flex", flexDirection: "column", gap: 6,
      fontSize: 12.5, fontWeight: 500, color: "#1F242D",
    }} htmlFor={htmlFor}>
      <span style={{ display: "flex", alignItems: "baseline", gap: 5, fontSize: 14 }}>
        {label}
        {required ? <span style={{ color: "#C8523B" }} aria-label="obligatorio">*</span> : <span style={{ color: "#727984", fontSize: 12, fontWeight: 400 }}>(opcional)</span>}
      </span>
      {children}
      {hint && <span style={{ color: "#727984", fontSize: 12, fontWeight: 400, lineHeight: 1.4 }}>{hint}</span>}
    </label>
  );
}

export function NativeSelect({
  id,
  name,
  defaultValue,
  required,
  disabled = false,
  value,
  onChange,
  children,
}: {
  id: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
}) {
  const isControlled = value !== undefined;

  return (
    <select
      id={id}
      name={name}
      {...(isControlled
        ? { value, onChange }
        : { defaultValue: defaultValue ?? "", onChange })}
      required={required}
      disabled={disabled}
      style={{
        height: 38, width: "100%", padding: "0 12px",
        border: disabled ? "1px dashed #B9B2A1" : "1px solid #C7BFA6", borderRadius: 8,
        background: disabled ? "#E9E5DA" : "white", fontSize: 13.5, color: disabled ? "#727984" : "#0E1116",
        fontFamily: "Poppins, sans-serif", outline: "none", cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </select>
  );
}
