"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface BloqueDraggableProps {
  sesionId: string;
  materiaCodigo: string;
  materiaNombre: string;
  docenteNombre: string;
  aulaNombre: string | null;
  grupoNombre: string;
  modalidad: string;
  colorClass?: string;
  disabled?: boolean;
}

export function BloqueDraggable({
  sesionId,
  materiaNombre,
  docenteNombre,
  aulaNombre,
  grupoNombre,
  modalidad,
  colorClass = "blue",
  disabled = false,
}: BloqueDraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: sesionId,
    disabled,
    data: {
      sesionId,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "grab",
    touchAction: "none",
    position: transform ? "absolute" : "relative",
    width: transform ? "200px" : "100%",
    zIndex: transform ? 999 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`sc-block ${colorClass} shadow-md transition-shadow hover:shadow-lg`}
    >
      <div className="flex flex-col gap-1 justify-between h-full">
        <div>
          <div className="b-title font-semibold truncate" title={materiaNombre}>
            {materiaNombre}
          </div>
          <div className="b-meta truncate" title={docenteNombre}>
            Doc: {docenteNombre}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1 text-[9px] opacity-90 border-t border-white/20 pt-1">
          <span className="font-semibold">{grupoNombre}</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[8px]">
            {modalidad === "virtual" ? "Virtual" : aulaNombre || "S/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
