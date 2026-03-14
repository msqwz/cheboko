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

    let query = supabase.from("Ticket").select("*");

    // Изоляция по роли
    if (role === "REGIONAL_MANAGER") {
      const { data: userData } = await supabase.from("User").select("address").eq("id", userId).single();
      if (userData?.address) {
        // фильтр по региону через location — упрощённо через clientId
      }
    } else if (role === "CLIENT_NETWORK_HEAD") {
      query = query.eq("clientId", userId);
    } else if (role === "CLIENT_POINT_MANAGER") {
      const { data: userData } = await supabase.from("User").select("locationId").eq("id", userId).single();
      if (userData?.locationId) query = query.eq("locationId", userData.locationId);
    } else if (!["ADMIN", "OPERATOR"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Фильтры
    if (periodFrom) query = query.gte("createdAt", periodFrom);
    if (periodTo) query = query.lte("createdAt", periodTo);
    if (filterStatus && filterStatus !== "all") query = query.eq("status", filterStatus);
    if (filterAddress) query = query.eq("locationId", filterAddress);
    if (filterEquipment) query = query.eq("equipmentId", filterEquipment);

    const { data: tickets, error } = await query;
    if (error) throw error;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = tickets.length;
    const totalThisMonth = tickets.filter(t => new Date(t.createdAt) >= startOfMonth).length;
    const completed = tickets.filter(t => t.status === "COMPLETED");
    const completedThisMonth = completed.filter(t => new Date(t.updatedAt) >= startOfMonth).length;
    const openCount = tickets.filter(t => !["COMPLETED", "CANCELED", "REJECTED"].includes(t.status)).length;
    const highPriorityCount = tickets.filter(t => t.priority === "HIGH" && !["COMPLETED", "CANCELED"].includes(t.status)).length;

    // Время выполнения: от openedAt (или createdAt) до completedAt (или updatedAt)
    let avgMs = 0, minMs = Infinity, maxMs = 0;
    if (completed.length > 0) {
      const times = completed.map(t => {
        const start = new Date(t.openedAt || t.createdAt).getTime();
        const end = new Date(t.completedAt || t.updatedAt).getTime();
        return end - start;
      });
      avgMs = times.reduce((a, b) => a + b, 0) / times.length;
      minMs = Math.min(...times);
      maxMs = Math.max(...times);
    }

    const msToHours = (ms: number) => ms === Infinity || ms === 0 ? null : Math.round(ms / (1000 * 60 * 60));

    // Количество выездов инженера (заявки в статусе ENROUTE или выше)
    const engineerVisits = tickets.filter(t =>
      ["ENROUTE", "IN_WORK", "COMPLETED", "ON_HOLD"].includes(t.status)
    ).length;
    const engineerVisitsThisMonth = tickets.filter(t =>
      ["ENROUTE", "IN_WORK", "COMPLETED", "ON_HOLD"].includes(t.status) &&
      new Date(t.createdAt) >= startOfMonth
    ).length;

    return NextResponse.json({
      // Основные метрики
      total,
      totalThisMonth,
      completed: completed.length,
      completedThisMonth,
      openCount,
      highPriorityCount,
      // Время выполнения (часы)
      avgClosingHours: msToHours(avgMs),
      minClosingHours: msToHours(minMs),
      maxClosingHours: msToHours(maxMs),
      // Выезды инженера
      engineerVisits,
      engineerVisitsThisMonth,
      // Устаревшие поля для обратной совместимости с дашбордом
      newTicketsCount: tickets.filter(t => t.status === "CREATED" || t.status === "OPENED").length,
      completedThisMonthCount: completedThisMonth,
      avgClosingTimeStr: msToHours(avgMs) !== null
        ? (msToHours(avgMs)! < 24 ? `${msToHours(avgMs)} ч.` : `${Math.round(msToHours(avgMs)! / 24)} д.`)
        : "—",
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
