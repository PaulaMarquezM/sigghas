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
      className={`sc-cell relative min-h-[42px] border-b border-dashed border-[#D8D1BD] border-l border-dashed first:border-l-0 transition-colors duration-200 ${
        isOver ? "bg-amber-100/60" : "hover:bg-amber-50/20"
      }`}
    >
      <div className="flex flex-col gap-1.5 h-full w-full relative min-h-[38px] pb-1">
        {children}
      </div>
    </div>
  );
}
