import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[320px] items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border border-[#D8D1BD] bg-white px-5 py-4 text-sm font-medium text-[#4A515E] shadow-sm">
        <Loader2 className="size-5 animate-spin text-[#1D3FD9]" aria-hidden="true" />
        Cargando información…
      </div>
    </div>
  );
}
