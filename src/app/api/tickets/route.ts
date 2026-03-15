import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recordTicketHistory, HistoryActions } from "@/lib/history";
import crypto from "crypto";
import { z } from "zod";

const ticketSchema = z.object({
  locationId: z.string().min(1, "Некорректный ID локации"),
  equipmentId: z.string().optional().nullable(),
  problemType: z.string().min(1, "Укажите тип проблемы"),
  description: z.string().min(5, "Описание должно быть содержательным"),
  photos: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 1. Валидация через Zod
    const validation = ticketSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0].message;
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { locationId, equipmentId, problemType, description, photos, attachments } = validation.data;

    // Генерация уникального номера заявки
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-`;

    const { data: lastTicket } = await supabase
      .from('Ticket')
      .select('ticketNumber')
      .like('ticketNumber', `${prefix}%`)
      .order('ticketNumber', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextSeq = 1;
    if (lastTicket) {
      const parts = lastTicket.ticketNumber.split("-");
      const lastSeq = parseInt(parts[2] || "0", 10);
      nextSeq = lastSeq + 1;
    }
    const ticketNumber = `${prefix}${String(nextSeq).padStart(4, "0")}`;

    // Получаем данные локации для clientId и уведомлений
    const { data: loc, error: locError } = await supabase
      .from('Location')
      .select('id, address, name, clientId')
      .eq('id', locationId)
      .single();

    if (locError || !loc) {
      return NextResponse.json({ error: "Указанная торговая точка не найдена" }, { status: 404 });
    }

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
        creatorId: session.user.id,
        clientId: loc?.clientId || session.user.id,

        status: "CREATED",
        priority: "MEDIUM",
      })
      .select()
      .single();

    if (error) throw error;

    // Отправляем уведомления о новой заявке (фоном)
    try {
      const { notifyTicketStatusChange } = await import("@/lib/notifications");
      notifyTicketStatusChange(
        newTicket.id,
        newTicket.ticketNumber,
        "",
        "CREATED",
        undefined,
        loc?.name || loc?.address || "Не указана"
      ).catch(e => console.error("Notification failed:", e));
    } catch (notifErr) {
      // Игнорируем ошибки уведомлений для клиента
    }

    // 3. Записываем в историю
    await recordTicketHistory(
      newTicket.id,
      session.user.id,

      HistoryActions.CREATED,
      undefined,
      newTicket.status
    );

    return NextResponse.json(newTicket, { status: 201 });

  } catch (error: any) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({
      error: "Внутренняя ошибка при создании заявки"
    }, { status: 500 });
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
        location:Location!locationId(*, legalName:name),
        equipment:Equipment!equipmentId(*),
        engineer:User!engineerId(*),
        creator:User!creatorId(*)
      `)
      .order('createdAt', { ascending: false });

    // Изоляция данных согласно матрице прав по ТЗ
    const userRole = session.user.role;
    const userId = session.user.id;


    if (userRole === 'REGIONAL_MANAGER') {
      // Менеджер региона видит только локации своего региона
      const region = session.user.region;
      if (region) {
        const { data: regionLocations } = await supabase
          .from('Location')
          .select('id')
          .eq('region', region);
        const locationIds = (regionLocations || []).map((l: any) => l.id);
        if (locationIds.length === 0) return NextResponse.json([]);
        query = query.in('locationId', locationIds);
      } else {
        return NextResponse.json([]);
      }
    } else if (userRole === 'CLIENT_NETWORK_HEAD') {
      // Руководитель сети видит все заявки своей компании
      query = query.eq('clientId', userId);
    } else if (userRole === 'CLIENT_POINT_MANAGER') {
      // Управляющий точкой видит только заявки по своему адресу
      const locationId = session.user.locationId;
      if (locationId) {
        query = query.eq('locationId', locationId);
      } else {
        return NextResponse.json([]);
      }

    } else if (userRole === 'CLIENT_SPECIALIST') {
      // Специалист видит только свои заявки
      query = query.eq('creatorId', userId);
    } else if (userRole === 'ENGINEER') {
      // Инженер видит либо назначенные на него, либо созданные им (если передан onlyCreated)
      const onlyCreated = searchParams.get('onlyCreated') === 'true';
      if (onlyCreated) {
        query = query.eq('creatorId', userId);
      } else {
        query = query.eq('engineerId', userId);
      }
    } else if (creatorId) {
      // Дополнительный фильтр если передан явно
      query = query.eq('creatorId', creatorId);
    }

    if (status) {
      if (status === 'active') {
        query = query.not('status', 'in', '(COMPLETED,CANCELED,REJECTED)');
      } else if (status === 'history') {
        query = query.in('status', ['COMPLETED', 'CANCELED', 'REJECTED']);
      } else if (status !== 'all') {
        query = query.eq('status', status);
      }
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (search) {
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
