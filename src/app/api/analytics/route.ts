import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get all tickets for status counts
    const { data: tickets, error: ticketsError } = await supabase
      .from('Ticket')
      .select('*');


    if (ticketsError) throw ticketsError;

    // 2. Calculate New Tickets (CREATED or OPENED)
    const newTicketsCount = tickets.filter(t => t.status === 'CREATED' || t.status === 'OPENED').length;

    // 3. Calculate High Priority Backlog
    const highPriorityCount = tickets.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED' && t.status !== 'CANCELED').length;

    // 4. Calculate Completed this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = tickets.filter(t => 
      t.status === 'COMPLETED' && 
      new Date(t.updatedAt) >= startOfMonth
    ).length;

    // 5. Calculate Average Closing Time (for COMPLETED tickets)
    const completedTickets = tickets.filter(t => t.status === 'COMPLETED');
    let avgClosingTimeStr = "—";
    
    if (completedTickets.length > 0) {
      const totalMs = completedTickets.reduce((acc, t) => {
        const start = new Date(t.createdAt).getTime();
        const end = new Date(t.updatedAt).getTime();
        return acc + (end - start);
      }, 0);
      
      const avgMs = totalMs / completedTickets.length;
      const avgHours = Math.round(avgMs / (1000 * 60 * 60));
      
      if (avgHours < 24) {
        avgClosingTimeStr = `${avgHours} ч.`;
      } else {
        const avgDays = Math.round(avgHours / 24);
        avgClosingTimeStr = `${avgDays} д.`;
      }
    }

    return NextResponse.json({
      newTicketsCount,
      highPriorityCount,
      completedThisMonth,
      avgClosingTimeStr
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
