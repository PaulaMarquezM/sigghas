import { Skeleton } from "@/components/ui/skeleton";

const surface = "bg-[#D8D1BD]/65";

function TableRows() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#D8D1BD] bg-[#EFEAD9]">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-5 border-b border-[#D8D1BD] px-4 py-3">
        {["w-20", "w-16", "w-14", "w-12"].map((width) => (
          <Skeleton key={width} className={`${surface} h-2.5 ${width}`} />
        ))}
      </div>
      <div className="divide-y divide-[#D8D1BD] bg-[#F5F1E8]">
        {Array.from({ length: 5 }).map((_, row) => (
          <div
            key={row}
            className="grid min-h-14 grid-cols-[1.4fr_1fr_1fr_0.8fr] items-center gap-5 px-4 py-3"
          >
            <div className="space-y-2">
              <Skeleton className={`${surface} h-3 w-36 max-w-full`} />
              <Skeleton className={`${surface} h-2.5 w-24 max-w-full`} />
            </div>
            <Skeleton className={`${surface} h-3 w-20 max-w-full`} />
            <Skeleton className={`${surface} h-3 w-24 max-w-full`} />
            <Skeleton className={`${surface} h-7 w-20 max-w-full rounded-lg`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardLoading() {
  return (
    <div
      className="w-full max-w-[1100px] animate-in fade-in duration-300"
      role="status"
      aria-live="polite"
      aria-label="Cargando vista"
    >
      <span className="sr-only">Cargando vista…</span>

      <div className="mb-7 flex items-start justify-between border-b border-[#D8D1BD] pb-6">
        <div className="space-y-3">
          <Skeleton className={`${surface} h-2.5 w-20`} />
          <Skeleton className={`${surface} h-8 w-64 max-w-[70vw]`} />
          <Skeleton className={`${surface} h-3 w-96 max-w-[75vw]`} />
        </div>
        <Skeleton className={`${surface} h-10 w-28 rounded-lg`} />
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-[#D8D1BD] bg-[#EFEAD9] p-5">
            <Skeleton className={`${surface} mb-5 h-5 w-5 rounded-md`} />
            <Skeleton className={`${surface} mb-2 h-7 w-14`} />
            <Skeleton className={`${surface} h-2.5 w-20`} />
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2.5">
        <Skeleton className={`${surface} h-10 min-w-52 flex-1 rounded-lg`} />
        <Skeleton className={`${surface} h-10 w-40 rounded-lg`} />
        <Skeleton className={`${surface} h-10 w-24 rounded-lg`} />
      </div>

      <TableRows />
    </div>
  );
}
