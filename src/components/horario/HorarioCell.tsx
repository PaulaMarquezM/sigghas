"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface HorarioCellProps {
  dia: number;
  hora: string;
  children?: React.ReactNode;
}

export function HorarioCell({ dia, hora, children }: HorarioCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${dia}-${hora}`,
    data: {
      dia,
      hora,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`sc-cell relative h-full overflow-visible border-l border-dashed border-[#D8D1BD] first:border-l-0 transition-colors duration-200 ${
        isOver ? "bg-amber-100/60" : "hover:bg-amber-50/20"
      }`}
    >
      {children}
    </div>
  );
}
