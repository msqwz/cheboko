import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;

  // Инженер — на задачи
  if (role === 'ENGINEER') {
    redirect("/engineer/tasks");
  }

  // Управляющий точкой — в свою зону
  if (role === 'CLIENT_POINT_MANAGER') {
    redirect("/point");
  }

  // Руководитель сети — в свою зону
  if (role === 'CLIENT_NETWORK_HEAD') {
    redirect("/network");
  }

  // Клиент и другие клиентские роли — на свои заявки
  const clientRoles = ['CLIENT_MANAGER', 'CLIENT_SPECIALIST'];
  if (clientRoles.includes(role)) {
    redirect("/tickets");
  }

  // Оператор — в свою зону
  if (role === 'OPERATOR') {
    redirect("/operator");
  }

  // Менеджер региона — в свою зону
  if (role === 'REGIONAL_MANAGER') {
    redirect("/manager");
  }

  // По умолчанию (только Админы) — на дашборд
  redirect("/admin");
}
