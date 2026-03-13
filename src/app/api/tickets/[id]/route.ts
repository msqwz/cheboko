import { NextResponse } from "next/server";
import { supabase, Ticket } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyTicketStatusChange } from "@/lib/notifications";
import { recordTicketHistory, HistoryActions } from "@/lib/history";



export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: result, error } = await supabase
      .from('Ticket')
      .select(`
        *,
        location:Location!locationId(*),
        equipment:Equipment!equipmentId(*),
        creator:User!creatorId(*),
        engineer:User!engineerId(*),
        history:TicketHistory(
          *,
          user:User!userId(name, role)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !result) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Sort history by date descending
    if (result.history) {
      result.history.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }


    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Разрешённые переходы статусов по ролям
const ALLOWED_STATUS_TRANSITIONS: Record<string, Record<string, string[]>> = {
  ADMIN: {
    CREATED:   ["OPENED", "CANCELED"],
    OPENED:    ["ASSIGNED", "CANCELED"],
    ASSIGNED:  ["ENROUTE", "OPENED", "CANCELED"],
    ENROUTE:   ["IN_WORK", "ASSIGNED", "CANCELED"],
    IN_WORK:   ["COMPLETED", "ON_HOLD", "CANCELED"],
    ON_HOLD:   ["IN_WORK", "CANCELED"],
    COMPLETED: [],
    CANCELED:  [],
  },
  OPERATOR: {
    CREATED:   ["OPENED", "CANCELED"],
    OPENED:    ["ASSIGNED", "CANCELED"],
    ASSIGNED:  ["ENROUTE", "OPENED", "CANCELED"],
    ENROUTE:   ["IN_WORK", "ASSIGNED"],
    IN_WORK:   ["ON_HOLD"],
    ON_HOLD:   ["IN_WORK"],
    COMPLETED: [],
    CANCELED:  [],
  },
  ENGINEER: {
    ASSIGNED:  ["ENROUTE"],
    ENROUTE:   ["IN_WORK"],
    IN_WORK:   ["COMPLETED", "ON_HOLD"],
    ON_HOLD:   ["IN_WORK"],
    CREATED:   [],
    OPENED:    [],
    COMPLETED: [],
    CANCELED:  [],
  },
  CLIENT: {
    CREATED:   ["CANCELED"],
    OPENED:    [],
    ASSIGNED:  [],
    ENROUTE:   [],
    IN_WORK:   [],
    ON_HOLD:   [],
    COMPLETED: [],
    CANCELED:  [],
  },
  CLIENT_MANAGER: {
    CREATED:   ["CANCELED"],
    OPENED:    [],
    ASSIGNED:  [],
    ENROUTE:   [],
    IN_WORK:   [],
    ON_HOLD:   [],
    COMPLETED: [],
    CANCELED:  [],
  },
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();
    const role = (session.user as { role?: string }).role || '';
    const userId = (session.user as { id?: string }).id || '';

    const { data: ticket, error: fetchError } = await supabase
      .from('Ticket')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Проверка смены статуса
    if (data.status && data.status !== ticket.status) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[role]?.[ticket.status] ?? [];
      if (!allowed.includes(data.status)) {
        return NextResponse.json(
          { error: `Роль '${role}' не может перевести заявку из '${ticket.status}' в '${data.status}'` },
          { status: 403 }
        );
      }
      // Инженер может менять статус только своих заявок
      if (role === "ENGINEER" && ticket.engineerId !== userId) {
        return NextResponse.json({ error: "Вы можете менять статус только своих заявок" }, { status: 403 });
      }
    }

    // Назначение инженера — только OPERATOR и ADMIN
    if (data.engineerId !== undefined && role !== "OPERATOR" && role !== "ADMIN") {
      return NextResponse.json({ error: "Недостаточно прав для назначения инженера" }, { status: 403 });
    }

    // Изменение приоритета — только OPERATOR и ADMIN
    if (data.priority && role !== "OPERATOR" && role !== "ADMIN") {
      return NextResponse.json({ error: "Недостаточно прав для изменения приоритета" }, { status: 403 });
    }

    // Ограничиваем поля, которые можно обновить
    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.engineerId !== undefined) {
      updateData.engineerId = data.engineerId || null;
      // Если инженер назначается на "Открытую" заявку, переводим её в "Назначена" автоматически
      if (data.engineerId && ticket.status === 'OPENED' && !data.status) {
        updateData.status = 'ASSIGNED';
        data.status = 'ASSIGNED'; // Для последующей записи в историю
      }
    }

    if (data.operatorComment) updateData.operatorComment = data.operatorComment;
    if (data.engineerComment) updateData.engineerComment = data.engineerComment;
    if (data.holdReason) updateData.holdReason = data.holdReason;
    if (data.engineerRecommendation) updateData.engineerRecommendation = data.engineerRecommendation;
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate).toISOString();
    if (data.photos !== undefined) updateData.attachments = data.photos; // Fix field mapping
    if (data.attachments !== undefined) updateData.attachments = data.attachments;

    const { data: updatedTicket, error: updateError } = await supabase
      .from('Ticket')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Запись истории
    if (data.status && data.status !== ticket.status) {
      await recordTicketHistory(id, userId, HistoryActions.STATUS_CHANGE, ticket.status, data.status);
    }

    if (data.engineerId !== undefined && data.engineerId !== ticket.engineerId) {
      await recordTicketHistory(id, userId, HistoryActions.ASSIGNMENT_CHANGE, ticket.engineerId || 'None', data.engineerId || 'None');
    }

    if (data.engineerComment && data.engineerComment !== ticket.engineerComment) {
      await recordTicketHistory(id, userId, HistoryActions.COMMENT_ADDED, undefined, data.engineerComment);
    }



    // Отправляем уведомления
    try {
      const { data: fullTicket } = await supabase
        .from('Ticket')
        .select('*, engineer:User!engineerId(*), location:Location!locationId(*)')
        .eq('id', id)
        .single();

      if (fullTicket) {
        // Уведомление при смене статуса
        if (data.status && data.status !== ticket.status) {
          await notifyTicketStatusChange(
            id,
            fullTicket.ticketNumber,
            ticket.status,
            data.status,
            fullTicket.engineer?.name,
            fullTicket.location?.legalName || fullTicket.location?.address
          );
        }

        // Уведомление о назначении инженера
        if (data.engineerId && data.engineerId !== ticket.engineerId) {
          const { notifyEngineerAssigned, notifyEngineerNewTask } = await import("@/lib/telegram");
          
          // В общий чат
          await notifyEngineerAssigned(
            fullTicket.ticketNumber,
            fullTicket.engineer?.name || "Инженер",
            fullTicket.location?.address || "Не указан"
          );

          // Лично инженеру, если есть его chat_id
          if (fullTicket.engineer?.telegramChatId) {
            await notifyEngineerNewTask(
              fullTicket.engineer.telegramChatId,
              fullTicket.ticketNumber,
              fullTicket.location?.address || "Не указан",
              fullTicket.title || "Техническое обслуживание"
            );
          }
        }
      }
    } catch (notifErr) {
      console.error("Failed to send update notifications:", notifErr);
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/tickets/[id] - удалить заявку
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'OPERATOR'].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from('Ticket')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
