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
  CREATED: 'CREATED',
  STATUS_CHANGE: 'STATUS_CHANGE',
  ASSIGNMENT_CHANGE: 'ASSIGNMENT_CHANGE',
  COMMENT_ADDED: 'COMMENT_ADDED',
  PRIORITY_CHANGE: 'PRIORITY_CHANGE',
  ATTACHMENT_ADDED: 'ATTACHMENT_ADDED',
};

