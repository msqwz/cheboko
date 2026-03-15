import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function QRHandlerPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  // Если не авторизован — редирект на логин с возвратом сюда
  if (!session?.user) {
    redirect(`/login?callbackUrl=/q/${id}`);
  }

  const role = session.user.role;

  // Логика редиректа по ролям
  if (role === 'ADMIN' || role === 'REGIONAL_MANAGER' || role === 'OPERATOR') {
    // Админы и менеджеры — в админку к деталям оборудования
    redirect(`/admin/equipment/${id}`);
  } 
  
  if (role === 'ENGINEER') {
    // Инженеры — на страницу оборудования для инженеров (история ремонтов)
    redirect(`/engineer/equipment/${id}`);
  }

  if (role.startsWith('CLIENT_') || role === 'CLIENT_MANAGER') {
    // Клиенты — сразу на создание новой заявки с привязкой к этому оборудованию
    redirect(`/tickets/new?equipmentId=${id}`);
  }

  // По умолчанию — на главную
  redirect("/");
}
