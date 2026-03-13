/**
 * Telegram Bot API helper
 * 
 * Настройка:
 * 1. Создайте бота через @BotFather в Telegram
 * 2. Получите токен бота
 * 3. Добавьте TELEGRAM_BOT_TOKEN в .env
 * 4. Узнайте chat_id через @userinfobot
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // Основной чат операторов

/**
 * Отправить сообщение в Telegram
 */
export async function sendTelegramMessage(
  message: string,
  chatId?: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("Telegram bot token not configured");
    return false;
  }

  const targetChatId = chatId || TELEGRAM_CHAT_ID;
  if (!targetChatId) {
    console.warn("Telegram chat ID not configured");
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error("Telegram API error:", result);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

/**
 * Отправить уведомление о новой заявке
 */
export async function notifyNewTicket(
  ticketNumber: string,
  problemType: string,
  address: string,
  priority: string
) {
  const priorityEmoji = priority === 'HIGH' ? '🔴' : priority === 'MEDIUM' ? '🟡' : '🟢';
  
  const message = `
${priorityEmoji} <b>Новая заявка #${ticketNumber}</b>

📋 Тип: ${problemType}
📍 Адрес: ${address}
⚡ Приоритет: ${priority}

Требуется назначение инженера!
  `.trim();

  return await sendTelegramMessage(message);
}

/**
 * Отправить уведомление о назначении инженера
 */
export async function notifyEngineerAssigned(
  ticketNumber: string,
  engineerName: string,
  address: string
) {
  const message = `
✅ <b>Заявка #${ticketNumber} назначена</b>

👷 Инженер: ${engineerName}
📍 Адрес: ${address}

Инженер уведомлён.
  `.trim();

  return await sendTelegramMessage(message);
}

/**
 * Отправить уведомление о завершении заявки
 */
export async function notifyTicketCompleted(
  ticketNumber: string,
  engineerName: string,
  address: string
) {
  const message = `
✅ <b>Заявка #${ticketNumber} выполнена!</b>

👷 Инженер: ${engineerName}
📍 Адрес: ${address}

Клиент может оставить отзыв.
  `.trim();

  return await sendTelegramMessage(message);
}

/**
 * Отправить уведомление инженеру о новой задаче
 */
export async function notifyEngineerNewTask(
  engineerChatId: string,
  ticketNumber: string,
  address: string,
  problemType: string
) {
  const message = `
🔔 <b>Новая задача!</b>

📋 Заявка: #${ticketNumber}
📍 Адрес: ${address}
🔧 Проблема: ${problemType}

Пожалуйста, свяжитесь с клиентом.
  `.trim();

  return await sendTelegramMessage(message, engineerChatId);
}
