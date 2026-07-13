"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { limpiarDuplicadosAction } from "./actions";

interface LimpiarDuplicadosBtnProps {
  periodoId: string;
  total: number;
}

export function LimpiarDuplicadosBtn({ periodoId, total }: LimpiarDuplicadosBtnProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleLimpiar() {
    setLoading(true);
    try {
      const res = await limpiarDuplicadosAction(periodoId);
      if (res.exito) {
        router.refresh();
      } else {
        alert(`Error al limpiar: ${res.error}`);
      }
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  if (confirm) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#FEF3C7", border: "1px solid #FDE68A",
        borderRadius: 8, padding: "6px 12px", flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: "#92400E" }}>
          ¿Eliminar {total - 1} duplicado(s)?
        </span>
        <button
          onClick={handleLimpiar}
          disabled={loading}
          style={{
            background: "#DC2626", color: "#fff", border: "none",
            borderRadius: 6, padding: "4px 12px", fontSize: 12,
            fontWeight: 600, cursor: "pointer", display: "flex",
            alignItems: "center", gap: 4,
          }}
        >
          {loading ? <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> : null}
          Confirmar
        </button>
        <button
          onClick={() => setConfirm(false)}
          disabled={loading}
          style={{
            background: "transparent", border: "none",
            fontSize: 12, color: "#92400E", cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title={`Eliminar ${total - 1} horario(s) duplicado(s), conservando solo el más reciente`}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 14px", borderRadius: 8, flexShrink: 0,
        border: "1px solid #FCA5A5", background: "#FEF2F2",
        color: "#DC2626", fontSize: 12, fontWeight: 500, cursor: "pointer",
      }}
    >
      <Trash2 style={{ width: 13, height: 13 }} />
      Limpiar {total - 1} duplicado{total - 1 !== 1 ? "s" : ""}
    </button>
  );
}
