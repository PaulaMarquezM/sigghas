"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { eliminarHorarioAction } from "./actions";
import type { EstadoHorario } from "@/types/database";

interface EliminarHorarioBtnProps {
  horarioId: string;
  estado: EstadoHorario;
}

export function EliminarHorarioBtn({ horarioId, estado }: EliminarHorarioBtnProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleEliminar() {
    if (estado === "publicado") {
      toast.error("Un horario publicado no puede eliminarse.");
      return;
    }

    if (!window.confirm(
      "¿Eliminar este horario? Se borrarán también sus clases e historial. Esta acción no se puede deshacer.",
    )) {
      return;
    }

    setLoading(true);
    try {
      const res = await eliminarHorarioAction(horarioId);
      if (!res.exito) {
        toast.error(res.error ?? "No se pudo eliminar el horario.");
        return;
      }
      toast.success("Horario eliminado.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleEliminar}
      disabled={loading}
      title={
        estado === "publicado"
          ? "Un horario publicado no puede eliminarse"
          : "Eliminar horario"
      }
      aria-label="Eliminar horario"
      style={{
        display: "grid",
        placeItems: "center",
        width: 34,
        height: 34,
        borderRadius: 8,
        border: "1px solid #FCA5A5",
        background: estado === "publicado" ? "#F9FAFB" : "#FEF2F2",
        color: estado === "publicado" ? "#9CA3AF" : "#DC2626",
        cursor: loading ? "wait" : estado === "publicado" ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />
      ) : (
        <Trash2 style={{ width: 15, height: 15 }} />
      )}
    </button>
  );
}
