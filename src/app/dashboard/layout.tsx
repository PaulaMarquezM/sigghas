import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar }  from "@/components/layout/topbar";
import { Toaster }  from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { perfil } = await getSession();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar nombre={perfil!.nombre} rol={perfil!.rol} />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}
