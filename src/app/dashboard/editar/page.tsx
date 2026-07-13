import React from "react";
import { requireRol } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Edit, FileText, Calendar } from "lucide-react";
import { LimpiarDuplicadosBtn } from "./LimpiarDuplicadosBtn";

const ESTADO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  borrador:   { label: "Borrador",   color: "#92400E", bg: "#FEF3C7" },
  aprobado:   { label: "Aprobado",   color: "#1E40AF", bg: "#DBEAFE" },
  publicado:  { label: "Publicado",  color: "#065F46", bg: "#D1FAE5" },
};

export default async function EditarHorarioIndexPage() {
  await requireRol("coordinador", "administrador");

  const supabase = await createClient();

  // Obtener periodo activo
  const { data: periodos } = await supabase
    .from("periodos")
    .select("*")
    .order("fecha_inicio", { ascending: false });

  const periodoActivo = periodos?.find((p) => p.activo) ?? periodos?.[0] ?? null;

  // Obtener todos los horarios del periodo activo
  const { data: horarios } = await supabase
    .from("horarios")
    .select("id, estado, generado_en, periodo_id")
    .eq("periodo_id", periodoActivo?.id ?? "")
    .order("generado_en", { ascending: false });

  const hayDuplicados = (horarios?.length ?? 0) > 1;

  return (
    <div style={{ maxWidth: 700 }}>
      {/* Encabezado */}
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #D8D1BD" }}>
        <span style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 10.5,
          textTransform: "uppercase", letterSpacing: "0.14em", color: "#4A515E",
          display: "block", marginBottom: 8,
        }}>
          Coordinación académica
        </span>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em", margin: 0, color: "#0E1116" }}>
              Editar Horario
            </h1>
            <p style={{ fontSize: 13, color: "#4A515E", margin: "6px 0 0" }}>
              {periodoActivo
                ? `Horarios del periodo académico ${periodoActivo.nombre}`
                : "Selecciona un horario para editar"}
            </p>
          </div>

          {/* Botón limpiar duplicados — solo visible si hay más de 1 */}
          {hayDuplicados && periodoActivo && (
            <LimpiarDuplicadosBtn
              periodoId={periodoActivo.id}
              total={horarios?.length ?? 0}
            />
          )}
        </div>
      </div>

      {/* Lista de horarios */}
      {!horarios || horarios.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px solid #D8D1BD", borderRadius: 12,
          padding: "48px 24px", textAlign: "center", color: "#4A515E",
        }}>
          <Calendar style={{ width: 32, height: 32, margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: 14 }}>
            No hay horarios generados para el periodo activo.
          </p>
          <Link
            href="/dashboard/generar"
            style={{
              display: "inline-block", marginTop: 16,
              background: "#0E1116", color: "#F5F1E8",
              padding: "8px 20px", borderRadius: 8,
              fontSize: 13, fontWeight: 500, textDecoration: "none",
            }}
          >
            Generar horario
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {horarios.map((h, idx) => {
            const estadoInfo = ESTADO_LABEL[h.estado] ?? { label: h.estado, color: "#4A515E", bg: "#EFEAD9" };
            const fecha = h.generado_en
              ? new Date(h.generado_en).toLocaleString("es-EC", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })
              : "—";

            return (
              <div
                key={h.id}
                style={{
                  background: idx === 0 ? "#fff" : "#FAFAF9",
                  border: `1px solid ${idx === 0 ? "#D8D1BD" : "#E5E0D5"}`,
                  borderRadius: 12,
                  padding: "16px 20px", display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 16,
                  opacity: idx === 0 ? 1 : 0.7,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                  {/* Número */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "#EFEAD9", border: "1px solid #D8D1BD",
                    display: "grid", placeItems: "center", flexShrink: 0,
                    fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#4A515E",
                  }}>
                    {String(idx + 1).padStart(2, "0")}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 999,
                        background: estadoInfo.bg, color: estadoInfo.color,
                        fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}>
                        {estadoInfo.label}
                      </span>
                      {idx === 0 && (
                        <span style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 999,
                          background: "#0E1116", color: "#F5F1E8",
                          fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.05em",
                        }}>
                          más reciente
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: 0, fontSize: 11, color: "#6B7280",
                      fontFamily: "JetBrains Mono, monospace",
                    }}>
                      Generado: {fecha}
                    </p>
                    <p style={{
                      margin: "2px 0 0", fontSize: 10, color: "#9CA3AF",
                      fontFamily: "JetBrains Mono, monospace", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      ID: {h.id}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <Link
                    href={`/api/pdf/horario/${h.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Descargar PDF"
                    style={{
                      display: "grid", placeItems: "center",
                      width: 34, height: 34, borderRadius: 8,
                      border: "1px solid #D8D1BD", background: "#EFEAD9",
                      color: "#4A515E", textDecoration: "none",
                    }}
                  >
                    <FileText style={{ width: 15, height: 15 }} />
                  </Link>

                  <Link
                    href={`/dashboard/editar/${h.id}`}
                    title="Abrir editor"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "0 14px", height: 34, borderRadius: 8,
                      background: "#0E1116", color: "#F5F1E8",
                      fontSize: 12, fontWeight: 500, textDecoration: "none",
                    }}
                  >
                    <Edit style={{ width: 13, height: 13 }} />
                    Editar
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
