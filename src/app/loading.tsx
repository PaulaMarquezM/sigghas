import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      className="grid min-h-screen place-items-center bg-[#F5F1E8] px-6"
      role="status"
      aria-live="polite"
      aria-label="Cargando SIGGHAS"
    >
      <span className="sr-only">Cargando SIGGHAS…</span>
      <div className="w-full max-w-md rounded-2xl border border-[#D8D1BD] bg-[#EFEAD9] p-8 shadow-[0_24px_70px_rgba(14,17,22,0.08)]">
        <div className="mb-8 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg bg-[#0E1116]/15" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 bg-[#0E1116]/15" />
            <Skeleton className="h-2.5 w-20 bg-[#0E1116]/10" />
          </div>
        </div>
        <Skeleton className="mb-3 h-8 w-3/4 bg-[#0E1116]/15" />
        <Skeleton className="mb-8 h-3 w-full bg-[#0E1116]/10" />
        <div className="space-y-4">
          <Skeleton className="h-11 w-full rounded-lg bg-[#0E1116]/10" />
          <Skeleton className="h-11 w-full rounded-lg bg-[#0E1116]/10" />
          <Skeleton className="h-11 w-full rounded-lg bg-[#0E1116]/20" />
        </div>
      </div>
    </main>
  );
}
