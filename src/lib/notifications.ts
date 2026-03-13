import { supabase } from "@/lib/supabase";
import { sendTelegramMessage, notifyNewTicket, notifyTicketCompleted } from "./telegram";

/**
 * Создать уведомление для пользователя
 */
export async function createNotification(
  userId: string,
  type: 'alert' | 'success' | 'info',
  title: string,
  description?: string
) {
  try {
    await supabase.from('Notification').insert({
      id: crypto.randomUUID(),
      userId,
      message: `${title}: ${description || ''}`,
      read: false,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

/**
 * Создать уведомления при смене статуса заявки
 */
export async function notifyTicketStatusChange(
  ticketId: string,
  ticketNumber: string,
  oldStatus: string,
  newStatus: string,
  engineerName?: string,
  locationName?: string
) {
  const { data: ticket } = await supabase
    .from('Ticket')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (!ticket) return;

  const notifications: Array<{ userId: string; type: any; title: string; description?: string }> = [];

  // Уведомление для клиента (создателя заявки)
  if (newStatus === 'ASSIGNED' && engineerName && ticket.creatorId) {
    notifications.push({
      userId: ticket.creatorId,
      type: 'success',
      title: `Заявке #${ticketNumber} назначен инженер`,
      description: `${engineerName} приступит к решению вашей проблемы в ближайшее время.`,
    });
  }

  if (newStatus === 'ENROUTE' && ticket.creatorId) {
    notifications.push({
      userId: ticket.creatorId,
      type: 'info',
      title: `Инженер выехал на заявку #${ticketNumber}`,
      description: `Специалист направляется к вам.`,
    });
  }

  if (newStatus === 'COMPLETED' && ticket.creatorId) {
    notifications.push({
      userId: ticket.creatorId,
      type: 'success',
      title: `Заявка #${ticketNumber} выполнена!`,
      description: `Инженер завершил работу. Пожалуйста, оцените качество обслуживания.`,
    });

    await notifyTicketCompleted(ticketNumber, engineerName || 'Инженер', locationName || 'Не указан');
  }

  if (newStatus === 'ON_HOLD' && ticket.creatorId) {
    notifications.push({
      userId: ticket.creatorId,
      type: 'alert',
      title: `Заявка #${ticketNumber} приостановлена`,
      description: `Инженер временно приостановил выполнение заявки.`,
    });
  }

  // Уведомление для оператора при создании заявки
  if (oldStatus === '' && newStatus === 'CREATED') {
    const { data: operators } = await supabase
      .from('User')
      .select('*')
      .in('role', ['ADMIN', 'OPERATOR']);

    if (operators) {
      for (const operator of operators) {
        notifications.push({
          userId: operator.id,
          type: 'alert',
          title: `Новая заявка #${ticketNumber}`,
          description: `Требуется назначение инженера.`,
        });
      }
    }

    await notifyNewTicket(ticketNumber, ticket.title || 'Не указан', locationName || 'Не указан', ticket.priority || 'MEDIUM');
  }

  // Создаём все уведомления
  for (const notif of notifications) {
    await createNotification(notif.userId, notif.type, notif.title, notif.description);
  }
}

/**
 * Уведомление о создании пользователя
 */
export async function notifyUserCreated(
  userName: string,
  userEmail: string,
  role: string
) {
  const { data: admins } = await supabase
    .from('User')
    .select('*')
    .eq('role', 'ADMIN');

  if (admins) {
    for (const admin of admins) {
      await createNotification(
        admin.id,
        'info',
        `Добавлен новый пользователь: ${userName}`,
        `Роль: ${role}, Email: ${userEmail}`
      );
    }
  }
}
