import { redirect } from "next/navigation";
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

  if (!perfil) {
    redirect("/registro?error=" + encodeURIComponent("Tu perfil no fue creado. Regístrate de nuevo."));
  }

  if (perfil.debe_cambiar_password) {
    redirect("/cambiar-password");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F5F1E8" }}>
      <Sidebar nombre={perfil.nombre} rol={perfil.rol} />

      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
          {children}
        </main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}
