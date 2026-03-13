import { supabase } from "./supabase";

/**
 * Записать действие в историю заявки
 */
export async function recordTicketHistory(
  ticketId: string, 
  userId: string, 
  action: string, 
  oldValue?: string, 
  newValue?: string
) {
  try {
    const { error } = await supabase.from('TicketHistory').insert({
      ticketId,
      userId,
      action,
      oldValue: oldValue?.toString(),
      newValue: newValue?.toString()
    });
    
    if (error) throw error;
  } catch (err) {
    console.error(`[HISTORY] Failed to record action "${action}" for ticket ${ticketId}:`, err);
  }
}

/**
 * Типы действий для истории
 */
export const HistoryActions = {
  CREATED: 'Создание заявки',
  STATUS_CHANGE: 'Смена статуса',
  ASSIGNMENT_CHANGE: 'Назначение инженера',
  COMMENT_ADDED: 'Добавлен комментарий',
  PRIORITY_CHANGE: 'Смена приоритета',
  ATTACHMENT_ADDED: 'Добавлен файл/фото',
};
