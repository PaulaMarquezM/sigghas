import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function CambiarPasswordPage() {
  const { perfil } = await getSession();

  if (!perfil) {
    redirect("/login");
  }

  if (!perfil.debe_cambiar_password) {
    redirect("/dashboard");
  }

  return <ChangePasswordForm nombre={perfil.nombre} />;
}
