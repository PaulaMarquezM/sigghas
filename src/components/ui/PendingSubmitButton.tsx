"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
};

/** Botón para formularios con Server Actions: evita envíos repetidos mientras procesa. */
export function PendingSubmitButton({
  children,
  pendingLabel = "Guardando…",
  disabled,
  className,
  style,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={className}
      style={{ ...style, opacity: disabled || pending ? 0.65 : style?.opacity, cursor: disabled || pending ? "wait" : style?.cursor }}
    >
      {pending ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />{pendingLabel}</> : children}
    </button>
  );
}
