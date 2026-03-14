import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const periodFrom = searchParams.get("from");
    const periodTo = searchParams.get("to");
    const filterStatus = searchParams.get("status");
    const filterRegion = searchParams.get("region");
    const filterAddress = searchParams.get("address");
    const filterEquipment = searchParams.get("equipment");

    // Проверка доступа
    const allowedRoles = ["ADMIN", "OPERATOR", "REGIONAL_MANAGER", "CLIENT_NETWORK_HEAD", "CLIENT_POINT_MANAGER"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Базовый запрос заявок
    let query = supabase.from("Ticket").select("*, location:Location!locationId(id, address, name, region)");

    // Изоляция по роли
    if (role === "REGIONAL_MANAGER") {
      const { data: userData } = await supabase.from("User").select("region").eq("id", userId).single();
      if (userData?.region) {
        const { data: regionLocs } = await supabase.from("Location").select("id").eq("region", userData.region);
        const locIds = (regionLocs || []).map((l: any) => l.id);
        if (locIds.length === 0) return NextResponse.json(buildEmptyResponse());
        query = query.in("locationId", locIds);
      } else {
        return NextResponse.json(buildEmptyResponse());
      }
    } else if (role === "CLIENT_NETWORK_HEAD") {
      query = query.eq("clientId", userId);
    } else if (role === "CLIENT_POINT_MANAGER") {
      const { data: userData } = await supabase.from("User").select("locationId").eq("id", userId).single();
      if (userData?.locationId) {
        query = query.eq("locationId", userData.locationId);
      } else {
        return NextResponse.json(buildEmptyResponse());
      }
    }

    // Фильтры
    if (periodFrom) query = query.gte("createdAt", periodFrom);
    if (periodTo) query = query.lte("createdAt", periodTo + "T23:59:59");
    if (filterStatus && filterStatus !== "all") query = query.eq("status", filterStatus);
    if (filterAddress) query = query.eq("locationId", filterAddress);
    if (filterEquipment) query = query.eq("equipmentId", filterEquipment);
    if (filterRegion && role === "ADMIN") {
      const { data: regionLocs } = await supabase.from("Location").select("id").eq("region", filterRegion);
      const locIds = (regionLocs || []).map((l: any) => l.id);
      if (locIds.length > 0) query = query.in("locationId", locIds);
    }

    const { data: tickets, error } = await query;
    if (error) throw error;

    // Запрос оборудования для метрик
    let eqQuery = supabase.from("Equipment").select("id, locationId");
    if (filterAddress) eqQuery = eqQuery.eq("locationId", filterAddress);
    const { data: allEquipment } = await eqQuery;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = tickets.length;
    const totalThisMonth = tickets.filter(t => new Date(t.createdAt) >= startOfMonth).length;

    const completed = tickets.filter(t => t.status === "COMPLETED");
    const completedThisMonth = completed.filter(t => new Date(t.updatedAt) >= startOfMonth).length;

    const openCount = tickets.filter(t => !["COMPLETED", "CANCELED", "REJECTED"].includes(t.status)).length;
    const highPriorityCount = tickets.filter(t => t.priority === "HIGH" && !["COMPLETED", "CANCELED"].includes(t.status)).length;

    // Оборудование на ремонте = уникальные equipmentId в активных заявках
    const activeEquipmentIds = new Set(
      tickets
        .filter(t => !["COMPLETED", "CANCELED", "REJECTED"].includes(t.status) && t.equipmentId)
        .map(t => t.equipmentId)
    );
    const equipmentOnRepair = activeEquipmentIds.size;
    const totalEquipment = allEquipment?.length || 0;
    const activeEquipment = totalEquipment - equipmentOnRepair;

    // Время выполнения: от openedAt до completedAt
    let avgMs = 0, minMs = Infinity, maxMs = 0;
    const completedWithTimes = completed.filter(t => t.openedAt && t.completedAt);
    if (completedWithTimes.length > 0) {
      const times = completedWithTimes.map(t => {
        return new Date(t.completedAt).getTime() - new Date(t.openedAt).getTime();
      });
      avgMs = times.reduce((a, b) => a + b, 0) / times.length;
      minMs = Math.min(...times);
      maxMs = Math.max(...times);
    } else if (completed.length > 0) {
      // Fallback: createdAt -> updatedAt
      const times = completed.map(t =>
        new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()
      );
      avgMs = times.reduce((a, b) => a + b, 0) / times.length;
      minMs = Math.min(...times);
      maxMs = Math.max(...times);
    }

    const msToHours = (ms: number) =>
      ms === Infinity || ms === 0 ? null : Math.round(ms / (1000 * 60 * 60) * 10) / 10;

    // Часы простоя = сумма времени заявок в статусе ON_HOLD
    // Считаем по истории если есть, иначе 0
    const downtimeHours = 0; // требует TicketHistory с временными метками — заглушка

    // Выезды инженера
    const engineerVisits = tickets.filter(t =>
      ["ENROUTE", "IN_WORK", "COMPLETED", "ON_HOLD"].includes(t.status)
    ).length;
    const engineerVisitsThisMonth = tickets.filter(t =>
      ["ENROUTE", "IN_WORK", "COMPLETED", "ON_HOLD"].includes(t.status) &&
      new Date(t.createdAt) >= startOfMonth
    ).length;

    // Топ оборудования по заявкам
    const equipmentBreakdown: Record<string, number> = {};
    tickets.forEach(t => {
      if (t.equipmentId) {
        equipmentBreakdown[t.equipmentId] = (equipmentBreakdown[t.equipmentId] || 0) + 1;
      }
    });

    // Разбивка по статусам
    const statusBreakdown: Record<string, number> = {};
    tickets.forEach(t => {
      statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
    });

    // Разбивка по приоритетам
    const priorityBreakdown: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    tickets.forEach(t => {
      if (t.priority && priorityBreakdown[t.priority] !== undefined) {
        priorityBreakdown[t.priority]++;
      }
    });

    // Динамика по месяцам (последние 6 месяцев)
    const monthlyData: { month: string; created: number; completed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      monthlyData.push({
        month: d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" }),
        created: tickets.filter(t => {
          const c = new Date(t.createdAt);
          return c >= d && c < end;
        }).length,
        completed: tickets.filter(t => {
          const c = new Date(t.updatedAt);
          return t.status === "COMPLETED" && c >= d && c < end;
        }).length,
      });
    }

    const avgClosingHours = msToHours(avgMs);

    return NextResponse.json({
      // Основные метрики (по ТЗ)
      total,
      totalThisMonth,
      completed: completed.length,
      completedThisMonth,
      openCount,
      highPriorityCount,
      // Оборудование
      equipmentOnRepair,
      activeEquipment,
      totalEquipment,
      // Время выполнения (часы)
      avgClosingHours,
      minClosingHours: msToHours(minMs),
      maxClosingHours: msToHours(maxMs),
      // Простой
      downtimeHours,
      downtimeCost: null, // требует стоимость часа — на будущее
      // Выезды инженера
      engineerVisits,
      engineerVisitsThisMonth,
      // Разбивки для графиков
      statusBreakdown,
      priorityBreakdown,
      monthlyData,
      // Обратная совместимость
      newTicketsCount: tickets.filter(t => ["CREATED", "OPENED"].includes(t.status)).length,
      avgClosingTimeStr: avgClosingHours !== null
        ? (avgClosingHours < 24 ? `${avgClosingHours} ч.` : `${Math.round(avgClosingHours / 24)} д.`)
        : "—",
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function buildEmptyResponse() {
  return {
    total: 0, totalThisMonth: 0, completed: 0, completedThisMonth: 0,
    openCount: 0, highPriorityCount: 0, equipmentOnRepair: 0, activeEquipment: 0,
    totalEquipment: 0, avgClosingHours: null, minClosingHours: null, maxClosingHours: null,
    downtimeHours: 0, downtimeCost: null, engineerVisits: 0, engineerVisitsThisMonth: 0,
    statusBreakdown: {}, priorityBreakdown: { HIGH: 0, MEDIUM: 0, LOW: 0 },
    monthlyData: [], newTicketsCount: 0, avgClosingTimeStr: "—",
  };
}
