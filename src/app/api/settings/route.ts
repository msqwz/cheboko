import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/settings - получить все настройки
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'OPERATOR'].includes(session.user.role)) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: allSettings, error } = await supabase
      .from('Settings')
      .select('*');

    if (error) throw error;

    return NextResponse.json(allSettings?.[0] || {});
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/settings - обновить настройки
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { data: allSettings } = await supabase
      .from('Settings')
      .select('*');

    if (allSettings && allSettings.length > 0) {
      const { data: updated, error } = await supabase
        .from('Settings')
        .update(body)
        .eq('id', allSettings[0].id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(updated);
    } else {
      const { data: created, error } = await supabase
        .from('Settings')
        .insert({
          id: crypto.randomUUID(),
          ...body,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
