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

  // Клиент — на свои заявки
  const clientRoles = ['CLIENT_MANAGER', 'CLIENT_NETWORK_HEAD', 'CLIENT_POINT_MANAGER', 'CLIENT_SPECIALIST'];
  if (clientRoles.includes(role)) {
    redirect("/tickets");
  }

  // Оператор — в свою зону
  if (role === 'OPERATOR') {
    redirect("/operator");
  }

  // По умолчанию (Админы, Менеджеры регионов) — на дашборд
  redirect("/admin");
}
