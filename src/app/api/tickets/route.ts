import { NextResponse } from "next/server";
import { supabase, Ticket } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordTicketHistory, HistoryActions } from "@/lib/history";


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { locationId, equipmentId, problemType, description, photos, attachments } = body;

    // Генерация уникального номера заявки
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `${year}-${month}-`;

    const { data: lastTicket } = await supabase
      .from('Ticket')
      .select('ticketNumber')
      .like('ticketNumber', `${prefix}%`)
      .order('ticketNumber', { ascending: false })
      .limit(1)
      .single();

    let nextSeq = 1;
    if (lastTicket) {
      const parts = lastTicket.ticketNumber.split("-");
      const lastSeq = parseInt(parts[2] || "0", 10);
      nextSeq = lastSeq + 1;
    }
    const ticketNumber = `${prefix}${String(nextSeq).padStart(4, "0")}`;

    const { data: newTicket, error } = await supabase
      .from('Ticket')
      .insert({
        id: crypto.randomUUID(),
        ticketNumber,
        locationId,
        equipmentId: equipmentId || null,
        title: problemType,
        description,
        attachments: attachments || photos || [],
        creatorId: (session.user as any).id,
        clientId: (session.user as any).id,
        status: "OPEN",
        priority: "MEDIUM",
      })
      .select()
      .single();

    if (error) throw error;

    // Отправляем уведомления о новой заявке
    try {
      const { data: loc } = await supabase
        .from('Location')
        .select('address, legalName')
        .eq('id', locationId)
        .single();
        
      const { notifyTicketStatusChange } = await import("@/lib/notifications");
      await notifyTicketStatusChange(
        newTicket.id,
        newTicket.ticketNumber,
        "", // oldStatus
        "CREATED",
        undefined,
        loc?.legalName || loc?.address || "Не указана"
      );
    } catch (notifErr) {
      console.error("Failed to send creation notification:", notifErr);
    }

    // 3. Записываем в историю
    await recordTicketHistory(
      newTicket.id, 
      (session.user as any).id, 
      HistoryActions.CREATED, 
      undefined, 
      newTicket.status
    );

    return NextResponse.json(newTicket, { status: 201 });

  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const priority = searchParams.get('priority');
    const creatorId = searchParams.get('creatorId');

    let query = supabase
      .from('Ticket')
      .select(`
        *,
        location:Location!locationId(*),
        equipment:Equipment!equipmentId(*),
        engineer:User!engineerId(*),
        creator:User!creatorId(*)
      `)
      .order('createdAt', { ascending: false });

    // Изоляция данных для клиента
    const userRole = (session.user as { role?: string }).role;
    if (userRole === 'CLIENT' || userRole === 'CLIENT_MANAGER') {
      query = query.eq('clientId', (session.user as { id?: string }).id);
    } else if (creatorId) {
      query = query.eq('creatorId', creatorId);
    }

    if (status) {
      if (status === 'active') {
        query = query.not('status', 'in', '(COMPLETED,CANCELED)');
      } else if (status === 'history') {

        query = query.in('status', ['COMPLETED', 'CANCELED']);
      } else if (status !== 'all') {
        query = query.eq('status', status);
      }
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (search) {
      // Поиск по нескольким полям - нужно делать через filter
      query = query.or(`ticketNumber.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: allTickets, error } = await query;

    if (error) throw error;

    return NextResponse.json(allTickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
