import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";

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
    <div className="max-w-3xl space-y-4">
      <Link href={backHref} className={buttonVariants({ variant: "ghost" })}>
        <ArrowLeft className="size-4" />
        Volver
      </Link>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

export function FormActions({ cancelHref }: { cancelHref: string }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-4">
      <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>Cancelar</Link>
      <Button type="submit">
        <Save className="size-4" />
        Guardar
      </Button>
    </div>
  );
}

export function FormMessage({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium text-gray-700" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function NativeSelect({
  id,
  name,
  defaultValue,
  required,
  children,
}: {
  id: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue ?? ""}
      required={required}
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
    </select>
  );
}
